# 시스템뷰: 스토어프론트와 커머스 백엔드의 협력

## 서비스와 협력 방식

| 서비스 | 구현 | 공개 계약 | 상태 소유 |
| --- | --- | --- | --- |
| 스토어프론트 | `apps/storefront` | 사용자 화면, Route Handler(`/{cc}/cart/add`, `/buy/[items]`, `/{cc}/cart/resume/[cartId]`, `/api/payment-return`), UCP API(`/ucp/**`) | 브라우저 쿠키: `_medusa_cart_id`, `_medusa_jwt`, `_medusa_pending_customer`, `_medusa_cache_id`, 로케일 |
| 커머스백엔드 | `apps/backend`(Medusa) | Store API `/store/*`, Auth API `/auth/*`, Admin API `/admin/*` | PostgreSQL의 상품·가격·지역·장바구니·주문·고객·결제 세션 |

- 협력은 **Orchestration**이다. 스토어프론트가 화면 과업마다 백엔드 Store API를 순서대로 호출하고, 다음 호출과 화면 이동을 스스로 정한다. 백엔드는 이벤트를 스토어프론트에 보내지 않는다.
- 전송은 HTTP(`@medusajs/js-sdk`, publishable key 필수). 회원 요청에는 `Authorization: Bearer <_medusa_jwt>`를 붙인다.
- 백엔드 안의 모듈·워크플로·검색 색인 협력은 [backend.md](backend.md), 스토어프론트 안의 조율은 [storefront.md](storefront.md)에서 연다.
- 화면 UI는 객체로 그리지 않는다. 화면에만 돌려주는 응답·오류는 스토어프론트 안에서 끝난다.

## SY01. 주문하기(장바구니 완료)

```jobflow
scope: 주문하기 — 장바구니를 주문으로 바꾸는 서비스 간 협력
Object: 스토어프론트, 커머스백엔드
스토어프론트.On주문하기요청 --> 커머스백엔드.message.장바구니완료요청
커머스백엔드.message.장바구니완료요청 --> 커머스백엔드.장바구니완료
커머스백엔드.장바구니완료.주문생성됨 --> 스토어프론트.message.주문생성응답
커머스백엔드.장바구니완료.완료불가 --> 스토어프론트.message.장바구니응답
```

- 구매자가 Place order를 누르거나 결제가 승인되면 스토어프론트(`placeOrder`)가 백엔드에 장바구니 완료를 요청한다(`POST /store/carts/{id}/complete`, 추정).
- 장바구니가 주문으로 바뀌면 백엔드는 `type: "order"`와 주문을 돌려준다. 스토어프론트는 장바구니 쿠키를 지우고 주문 캐시를 무효화한 뒤 `/{배송 국가}/order/{id}/confirmed`로 보낸다.
- 결제 미승인·재고 부족 등으로 완료하지 못하면 백엔드는 `type: "cart"`와 오류가 담긴 장바구니 또는 HTTP 오류를 돌려준다. 스토어프론트는 오류 메시지를 화면에 보여 주거나(검토 단계) 장바구니로 보낸다(결제 복귀).

## SY02. 외부 결제 복귀 처리

```jobflow
scope: 결제 복귀 — 결제 제공자에서 돌아온 구매자의 주문 마무리
Object: 스토어프론트, 커머스백엔드
스토어프론트.On결제복귀요청 --> 스토어프론트.복귀유형판정
스토어프론트.복귀유형판정.Adyen복귀 --> 커머스백엔드.message.결제세션갱신요청
스토어프론트.복귀유형판정.Stripe복귀 --> 커머스백엔드.message.장바구니조회요청
커머스백엔드.message.결제세션갱신요청 --> 스토어프론트.message.결제세션갱신응답
스토어프론트.message.결제세션갱신응답 --> 커머스백엔드.message.장바구니완료요청
커머스백엔드.message.장바구니조회요청 --> 스토어프론트.message.장바구니응답
스토어프론트.message.장바구니응답 --> 스토어프론트.결제세션대조
스토어프론트.결제세션대조.결제확인 --> 커머스백엔드.message.장바구니완료요청
```

- 결제 제공자가 구매자를 `/api/payment-return`으로 돌려보내면 스토어프론트가 파라미터로 복귀 유형을 판정한다. `cart_id`·Stripe 파라미터가 모두 없으면 백엔드를 부르지 않고 `Cart?error=payment_failed`로 보낸다.
- `redirectResult`가 있으면(Adyen) 장바구니 쿠키를 복원하고 결제 세션의 `client_data`를 갱신해 달라고 요청한다.
- `payment_intent`·`client_secret`가 있으면(Stripe 계열) 장바구니의 결제 세션 데이터를 조회한다.
- 결제 세션이 갱신되면 스토어프론트는 조건 없이 장바구니 완료를 요청한다. 결과는 SY01과 같고, 주문이 생기지 않으면 `Cart?error=payment_failed`로 보낸다.
- 백엔드는 `payment_collection.payment_sessions.data`가 담긴 장바구니를 돌려준다(`GET /store/carts/{id}`).
- 스토어프론트는 세션의 `id`·`client_secret`가 복귀 파라미터와 맞는지 대조한다. 맞지 않으면 `Cart?error=payment_failed`, `redirect_status=failed`면 `Checkout?step=payment`로 보내고 끝난다.
- 결제가 확인되면 장바구니 쿠키를 복원하고 완료를 요청한다. 주문이 생기지 않으면 `Cart?error=order_failed`로 보낸다.

## SY03. 로그인과 고객 레코드 확보

```jobflow
scope: 로그인 — 인증 토큰 발급과 고객 레코드 생성·장바구니 이전
Object: 스토어프론트, 커머스백엔드
스토어프론트.On로그인요청 --> 커머스백엔드.message.로그인요청
커머스백엔드.message.로그인요청 --> 커머스백엔드.자격확인
커머스백엔드.자격확인.토큰발급 --> 스토어프론트.message.인증토큰응답
커머스백엔드.자격확인.이메일인증필요 --> 스토어프론트.message.이메일인증필요응답
커머스백엔드.자격확인.자격불일치 --> 스토어프론트.message.로그인실패응답
스토어프론트.message.이메일인증필요응답 --> 커머스백엔드.message.인증메일요청
스토어프론트.message.인증토큰응답 --> 커머스백엔드.message.내고객조회요청
커머스백엔드.message.내고객조회요청 --> 커머스백엔드.고객연결확인
커머스백엔드.고객연결확인.고객있음 --> 스토어프론트.message.고객응답
커머스백엔드.고객연결확인.고객없음 --> 스토어프론트.message.고객조회거절
스토어프론트.message.고객조회거절 --> 커머스백엔드.message.고객생성요청
커머스백엔드.message.고객생성요청 --> 스토어프론트.message.고객생성응답
스토어프론트.message.고객생성응답 --> 커머스백엔드.message.로그인요청
스토어프론트.message.고객응답 --> 스토어프론트.장바구니보유확인
스토어프론트.장바구니보유확인.익명장바구니있음 --> 커머스백엔드.message.장바구니이전요청
```

- 로그인 폼이나 회원가입 직후 스토어프론트(`completeLogin`)가 이메일·비밀번호로 로그인을 요청한다(`POST /auth/customer/emailpass`, 추정). 회원가입은 그 전에 `register`로 identity를 만든다.
- 자격이 맞으면 백엔드가 JWT를 돌려준다.
- 이메일 인증이 필요하면 백엔드가 `verification_required`와 임시 토큰을 돌려준다.
- 자격이 틀리면 오류를 돌려주고, 스토어프론트는 로그인 화면에 메시지를 보여 준다.
- 인증 필요 응답을 받으면 스토어프론트가 인증 메일 발송을 요청하고, 화면에 안내를 띄운 뒤 끝난다. 발송 요청의 실패는 무시한다.
- 토큰을 받으면 그 토큰으로 내 고객 정보를 조회한다.
- 토큰에 고객이 연결돼 있으면 고객 정보를 돌려준다.
- 가입 직후·인증 직후처럼 고객이 없으면 조회를 거절한다.
- 스토어프론트는 대기 고객 쿠키의 이름·전화번호로 고객 생성을 요청한다.
- 백엔드가 고객을 만들면 응답한다.
- 고객이 연결된 토큰을 얻기 위해 스토어프론트가 다시 로그인을 요청한다. 이후 토큰 쿠키를 저장한다.
- 고객이 확인되면 스토어프론트가 장바구니 쿠키가 있는지 본다.
- 익명 장바구니가 있으면 고객에게 이전을 요청한다. 실패하면 로그인은 된 채 오류를 보여 주고, 이후 화면 상단 배너에서 다시 시도할 수 있다.

## SY04. UCP 체크아웃 세션

```jobflow
scope: UCP 체크아웃 — 에이전트 요청을 백엔드 장바구니로 바꾸기
Object: 스토어프론트, 커머스백엔드
스토어프론트.OnUCP체크아웃생성요청 --> 스토어프론트.요청장바구니판정
스토어프론트.요청장바구니판정.기존장바구니 --> 커머스백엔드.message.장바구니조회요청
스토어프론트.요청장바구니판정.새품목 --> 커머스백엔드.message.지역조회요청
커머스백엔드.message.지역조회요청 --> 스토어프론트.message.지역응답
스토어프론트.message.지역응답 --> 스토어프론트.배송국가확인
스토어프론트.배송국가확인.배송가능 --> 커머스백엔드.message.품목포함장바구니생성요청
커머스백엔드.message.품목포함장바구니생성요청 --> 스토어프론트.message.장바구니응답
커머스백엔드.message.장바구니조회요청 --> 스토어프론트.message.장바구니응답
스토어프론트.message.장바구니응답 --> 커머스백엔드.message.장바구니정보갱신요청
커머스백엔드.message.장바구니정보갱신요청 --> 스토어프론트.message.장바구니응답
```

- 에이전트가 `POST /ucp/v1/checkout-sessions`를 보내면 스토어프론트가 요청에 기존 `cart_id`가 있는지, 새 품목인지 판정한다. 품목이 비었으면 백엔드 호출 없이 오류로 끝난다.
- 기존 장바구니면 열린 장바구니인지 조회한다. 없거나 완료·취소됐으면 404로 끝난다.
- 새 품목이면 지역 목록을 조회한다.
- 백엔드가 지역(국가 포함)을 돌려준다.
- 스토어프론트는 배송 국가가 지역에 있는지 확인한다. 없으면 `unsupported_country` 오류로 끝난다.
- 배송 가능하면 지역과 품목으로 장바구니 생성을 요청한다. 실패하면 `item_unavailable`로 끝난다.
- 백엔드가 장바구니를 돌려준다.
- 백엔드가 조회한 장바구니를 돌려준다.
- 장바구니를 얻으면 이메일·배송지 등 요청의 체크아웃 정보를 반영해 달라고 요청한다(`applyCheckoutDetails`).
- 백엔드가 갱신된 장바구니를 돌려준다. 스토어프론트는 이것을 UCP 형식(`incomplete`·`requires_escalation`·`completed`·`canceled`)으로 바꿔 에이전트에 응답한다. 결제가 필요한 세션에는 `continue_url`을 붙인다.

## 그 밖의 서비스 간 호출

판단 없이 요청·응답으로 끝나는 호출은 그림 없이 남긴다.

| 과업 | 스토어프론트 호출 | 백엔드 계약(추정 포함) |
| --- | --- | --- |
| 지역 맵 조회(미들웨어) | `fetch /store/regions`(1시간 캐시) | `GET /store/regions` (확인) |
| 상품·카테고리·컬렉션 조회 | `listProducts`, `getCategoryByHandle`, `getCollectionByHandle` | `GET /store/products`, `/store/product-categories`, `/store/collections` |
| 상품 검색(InstantSearch) | `@medusajs/instantsearch-adapter` | `POST /store/search` (미들웨어 `configureStoreSearch`, 확인) |
| 장바구니 생성·품목 추가·수정·삭제 | `getOrSetCart`, `addToCart`, `updateLineItem`, `deleteLineItem` | `POST /store/carts`, `/line-items` |
| 주소·배송·결제 세션 | `setAddresses`, `setShippingMethod`, `initiatePaymentSession` | `POST /store/carts/{id}`, `/shipping-methods`, 결제 컬렉션 |
| 할인·기프트카드 | `applyPromotions`, `applyGiftCard` 등 | `POST /store/carts/{id}/promotions` 등 |
| 주문 조회 | `retrieveOrder`, `listOrders` | `GET /store/orders/{id}`, `GET /store/orders` (확인) |
| 고객 정보·주소 | `updateCustomer`, `addCustomerAddress` 등 | `/store/customers/me/**` |
| 주문 이전 | `createTransferRequest`, `acceptTransferRequest`, `declineTransferRequest` | `/store/orders/{id}/transfer/*` |
| 이메일 인증 확인 | `confirmEmailVerification` | 미확인 |
| 로그아웃 | `signout` | `DELETE /auth/session` |
