# 커머스 백엔드(apps/backend) 내부 흐름

## 모듈 구성

| 모듈 | 위치 | 책임 | 프로젝트 고유 코드 |
| --- | --- | --- | --- |
| HTTP 계층 | `@medusajs/medusa` 기본 라우트, `src/api/**` | Store·Auth·Admin API, publishable key·인증 검사 | `src/api/middlewares.ts`(`/store/search` 범위), `store/custom`·`admin/custom` 예시(200만 응답) |
| 워크플로 | `@medusajs/core-flows` | 장바구니 완료·주문 생성·이전 등 업무 단계 | 없음(`src/workflows`는 README뿐) |
| 커머스 모듈 | `@medusajs/<module>` | product, pricing, cart, order, customer, auth, payment, region, fulfillment 등 데이터 소유 | 없음(`src/modules`는 README뿐) |
| 검색 색인 | `src/search/product.ts`, `helpers/*` | 상품 문서 정의·변환·이벤트 구독 | 있음 |
| 초기 데이터 | `src/migration-scripts/*`, `src/scripts/seed-demo-products.ts` | 스토어·지역·재고 위치·배송·카테고리·상품 시드 | 있음 |
| 지역 정책 | `src/lib/region-store-policies.ts` | 지역 `metadata`의 정책 키와 기본값 | 있음 |
| Admin 대시보드 | `@medusajs/dashboard` | 운영자 UI(`/app`) | 없음(`src/admin`에 i18n 틀만) |

Medusa 패키지 내부는 설치된 소스가 없어 읽지 못했다. 아래 B01·B05는 공개 문서와 SDK 이름에 기댄 블랙박스 수준의 확대이며, B02~B04가 이 저장소 코드로 확인한 흐름이다.

## B01. Store API 요청 처리 구조

```jobflow
orchestrator: MedusaHttp
Object: MedusaHttp, PublishableKeyCheck, AuthCheck, RouteHandler, CoreFlow
MedusaHttp.OnStoreRequest --> PublishableKeyCheck.Verify
PublishableKeyCheck.Verify.valid --> AuthCheck.Resolve
PublishableKeyCheck.Verify.invalid --> MedusaHttp.RejectRequest
AuthCheck.Resolve.allowed --> RouteHandler.Handle
AuthCheck.Resolve.denied --> MedusaHttp.RejectRequest
RouteHandler.Handle --> CoreFlow.Run
CoreFlow.Run.result --> MedusaHttp.Respond
```

- `/store/*` 요청이 오면 HTTP 계층이 `x-publishable-api-key`를 확인한다(추정, Medusa 기본 동작).
- 키가 유효하면 키의 판매 채널을 요청 범위로 정하고 인증 정보를 해석한다. 회원 전용 경로(`/store/customers/me` 등)는 Bearer 토큰의 actor가 필요하다.
- 키가 없거나 틀리면 요청을 거절한다. 스토어프론트에서는 publishable key 오류로 보인다(AGENTS.md 기록).
- 접근이 허용되면 파일 기반 라우트 핸들러가 요청을 처리한다.
- 접근할 수 없으면 401 등으로 거절한다. 스토어프론트의 `completeLogin`은 이 거절을 "고객 없음"으로 해석한다.
- 쓰기 요청은 핸들러가 core-flows 워크플로를 실행한다.
- 워크플로 결과를 응답으로 돌려준다.

## B02. 상품 검색 요청 범위 지정

```jobflow
orchestrator: MedusaHttp
Object: MedusaHttp, configureStoreSearch, SearchIndex
MedusaHttp.OnSearchRequest --> configureStoreSearch.Apply
configureStoreSearch.Apply.allowedIndex --> SearchIndex.Query
configureStoreSearch.Apply.otherIndex --> MedusaHttp.RejectRequest
SearchIndex.Query.result --> MedusaHttp.Respond
```

- 스토어프론트의 InstantSearch가 `POST /store/search`를 보내면 미들웨어(`src/api/middlewares.ts`)가 요청을 손본다.
- `product` 색인 요청이면 `status`(공개 상품)와 `sales_channel_ids`(키의 판매 채널)로 범위를 좁혀 색인을 조회한다. 두 필드는 필터 전용이라 결과에 나오지 않는다.
- 허용되지 않은 색인이면 거절한다(`allowed_indexes`에 `product`만 있음).
- 검색 결과(제목·핸들·썸네일·카테고리·라벨·옵션 값·통화별 가격 필드)를 돌려준다. 가격 필드는 `eur`, `usd`로 고정되며 스토어프론트의 `SEARCH_PRICE_CURRENCIES`와 맞춰야 한다.

## B03. 상품 검색 색인 갱신

```jobflow
orchestrator: SearchIngestion
Object: SearchIngestion, resolveProductIds, queryGraph, loadPricing, toDocument, SearchIndex
SearchIngestion.OnProductEvent --> resolveProductIds.Resolve
resolveProductIds.Resolve.productIds --> queryGraph.ReadProducts
queryGraph.ReadProducts.rows --> loadPricing.Load
loadPricing.Load.pricing --> toDocument.Build
toDocument.Build.document --> SearchIndex.Upsert
toDocument.Build.none --> SearchIndex.Delete
SearchIngestion.OnProductDeleted --> SearchIndex.Delete
```

- 상품·변형·옵션·태그·카테고리·가격 관련 이벤트(`PRODUCT_EVENTS`)가 발생하면 색인 갱신을 시작한다. 이벤트는 `{ id }` 하나 또는 묶음으로 온다.
- 이벤트 대상이 상품이 아니면(변형·카테고리 등) `query.graph`로 연결된 상품 ID를 찾는다. 삭제된 행도 soft delete라 `withDeleted`로 따라간다.
- 찾은 상품을 `PRODUCT_GRAPH_FIELDS`(판매 채널·카테고리·태그·옵션 포함)로 읽는다.
- 읽은 행의 통화별 가격을 불러온다.
- 상품 행과 가격으로 검색 문서를 만든다.
- 문서가 만들어지면 색인에 반영한다.
- 문서가 없으면(상품이 사라졌거나 읽히지 않으면) 색인에서 지운다.
- `product.deleted` 이벤트는 문서를 바로 지운다.
- 가격 목록 변경, 가격 목록의 시작·종료일 도래, 판매 채널 일괄 연결, 카테고리 일괄 연결, 변형 가격 직접 갱신은 이벤트가 없어 반영되지 않는다(코드 TODO, 분석서 I10). 색인 정의에는 이벤트 처리(`consume: graphConsume`)와 전체 적재(`seed: graphSeed`)가 있다. 주석의 catch-up 처리를 언제 실행하는지는 프레임워크 동작이라 미확인이다.

## B04. 초기 데이터 시드

```jobflow
orchestrator: initialDataSeed
Object: initialDataSeed, StoreSetup, RegionSetup, FulfillmentSetup, CatalogSetup
initialDataSeed.Run --> StoreSetup.CreateSalesChannelAndKey
StoreSetup.CreateSalesChannelAndKey --> RegionSetup.CreateRegionAndTax
RegionSetup.CreateRegionAndTax --> FulfillmentSetup.CreateStockAndShipping
FulfillmentSetup.CreateStockAndShipping --> CatalogSetup.CreateCategoriesAndProducts
```

- `medusa db:migrate`가 migration-scripts를 실행하면 초기 시드가 시작된다. 마이그레이션 스크립트라 DB마다 한 번만 실행된다.
- 기본 판매 채널(Default Sales Channel)과 기본 publishable key를 만들고 스토어에 연결한다. 스토어프론트의 `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`가 이 키다.
- 지역 Europe(EUR, gb/de/dk/se/fr/es/it, 결제 `pp_system_default`, 정책 메타데이터 기본값)과 국가별 세금 지역을 만든다.
- 재고 위치(European Warehouse), 배송 프로필·서비스 존, Standard·Express Shipping(각 10)을 만든다.
- 카테고리(Shirts, Sweatshirts, Pants, Merch)와 상품 4종(T-Shirt, Sweatshirt, Sweatpants, Shorts)과 재고를 만든다.
- `region-store-policies.ts` 마이그레이션은 모든 지역을 읽어 `metadata`에 없는 정책 키만 기본값으로 채운다(`updateRegionsWorkflow`). 이미 값이 있는 키는 바꾸지 않는다.
- `seed-demo-products.ts`는 `medusa exec`로 직접 실행하는 선택 스크립트다. 데모 상품 50개와 컬렉션 4개(Summer Essentials, Winter Layers, Everyday Basics, Limited Run)·공유 옵션을 10개씩 나눠 만들고 검색 색인에 넣는다. 핸들이 같으면 건너뛴다.

## B05. 장바구니 완료(블랙박스)

```jobflow
orchestrator: CompleteCart
Object: CompleteCart, CartModule, PaymentModule, InventoryModule, OrderModule
CompleteCart.Run --> CartModule.Validate
CartModule.Validate.ready --> PaymentModule.Authorize
CartModule.Validate.incomplete --> CompleteCart.ReturnCart
PaymentModule.Authorize.authorized --> InventoryModule.Reserve
PaymentModule.Authorize.notAuthorized --> CompleteCart.ReturnCart
InventoryModule.Reserve --> OrderModule.CreateOrder
OrderModule.CreateOrder --> CompleteCart.ReturnOrder
```

- `POST /store/carts/{id}/complete`가 오면 장바구니 완료 워크플로가 시작된다(추정: `completeCartWorkflow`).
- 장바구니에 이메일·주소·배송 방법·결제 세션이 갖춰졌는지 확인한다.
- 갖춰지지 않았으면 오류와 함께 장바구니를 돌려준다.
- 결제 세션을 승인한다. 수동 결제는 바로 승인되고, Stripe·Adyen은 제공자 상태로 판정한다.
- 승인되면 재고를 예약한다.
- 승인되지 않으면 장바구니를 돌려준다. 스토어프론트는 이것을 `type: "cart"`로 받는다.
- 재고를 예약하면 주문을 만든다.
- 주문을 돌려준다. 실패 시 보상(예약·승인 해제)은 워크플로 내부 동작이라 미확인이다.
