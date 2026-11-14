# Medusa DTC 스토어프론트 Navigation

## 범위·확인 기준

- 대상: `apps/storefront`(Next.js App Router)의 사용자 화면 라우트와, 화면 이동을 만드는 Route Handler·미들웨어·Server Action. 기준선은 커밋 `44f2979`이다.
- 확인 방법: 라우트 등록(`src/app/**`), `src/middleware.ts`, 페이지 진입 처리(`notFound()`·슬롯 선택), 링크·`router.push`·`redirect()` 호출, `src/lib/data/*`의 API 호출을 정적으로 읽었다. 앱을 실행하거나 렌더링해 보지 않았다.
- 제외: UCP 에이전트 API(`/ucp/**`, `/.well-known/ucp`), `llms.txt`·`robots`·`sitemap`, 상품 Markdown(`/products/[handle].md`)처럼 화면이 없는 경로. 백엔드 Admin(`/app`)은 기본 대시보드만 있고 커스텀 라우트가 없어 제외했다.
- API 경로: `node_modules`가 설치되지 않아 `@medusajs/js-sdk` 메서드의 실제 HTTP 경로는 확인하지 못했다. 아래 대응표에서 코드에 경로 문자열이 직접 있는 항목만 `확인`, 나머지는 SDK 메서드명에 따른 `추정`이다.
- 모든 사용자 경로 앞에는 `/{countryCode}`가 붙는다. `LocalizedClientLink`가 현재 국가 코드를 자동으로 붙인다.

### 라우트 맵

| 노드 | 경로 | 접근 조건·진입 처리 | 근거 |
| --- | --- | --- | --- |
| (country_guard) | 모든 경로(`api`·`ucp`·`buy`·정적 파일 제외) | 첫 세그먼트가 유효한 국가면 통과. `/`는 기본 국가로 rewrite. 그 밖에는 `/{country}{path}`로 307 redirect | `src/middleware.ts` `middleware` |
| Home | `/{cc}` | 지역·컬렉션이 없으면 빈 화면(`null`) | `app/[countryCode]/(main)/page.tsx` |
| Store | `/{cc}/store` | 지역 없으면 NotFound | `(main)/store/page.tsx` |
| Category | `/{cc}/categories/[...category]` | 카테고리 없으면 NotFound | `(main)/categories/[...category]/page.tsx` |
| Collection | `/{cc}/collections/[handle]` | 컬렉션 없으면 NotFound | `(main)/collections/[handle]/page.tsx` |
| Search | `/{cc}/search?q=` | 지역 없으면 NotFound. 검색어 없으면 빈 결과 | `(main)/search/page.tsx` |
| ProductDetail | `/{cc}/products/[handle]` | 지역·상품 없으면 NotFound | `(main)/products/[handle]/page.tsx` |
| Cart | `/{cc}/cart` | 장바구니가 없거나 조회에 실패하면 빈 장바구니 장면(`retrieveCart`가 오류를 `null`로 바꾸므로 page의 `notFound()` 분기는 실행되지 않음) | `(main)/cart/page.tsx`, `lib/data/cart.ts` `retrieveCart` |
| Checkout | `/{cc}/checkout?step=address\|delivery\|payment\|review` | 장바구니 없으면 NotFound. 배송·결제 수단 조회 실패 시 입력 폼 영역 없음. 단계는 쿼리로 같은 페이지 안에서 전환 | `(checkout)/checkout/page.tsx`, `modules/checkout/templates/checkout-form` |
| OrderConfirmed | `/{cc}/order/[id]/confirmed` | 주문 조회 실패 시 NotFound | `(main)/order/[id]/confirmed/page.tsx` |
| AccountLogin | `/{cc}/account` 및 하위 경로 | 비로그인이면 `@login` 슬롯(로그인·회원가입 컴포넌트) 표시 | `(main)/account/layout.tsx`, `@login/default.tsx` |
| AccountOverview | `/{cc}/account` | 로그인 시 `@dashboard` 슬롯 | `account/@dashboard/page.tsx` |
| Profile | `/{cc}/account/profile` | 로그인 필요 | `@dashboard/profile/page.tsx` |
| Addresses | `/{cc}/account/addresses` | 로그인 필요 | `@dashboard/addresses/page.tsx` |
| Orders | `/{cc}/account/orders` | 로그인 필요 | `@dashboard/orders/page.tsx` |
| OrderDetail | `/{cc}/account/orders/details/[id]` | 로그인 필요, 주문 없으면 NotFound | `@dashboard/orders/details/[id]/page.tsx` |
| VerifyAccount | `/{cc}/verify-account?token=` | 이메일 인증 링크로 직접 진입 | `(main)/verify-account/page.tsx` |
| TransferRequest | `/{cc}/order/[id]/transfer/[token]` | 이전 요청 메일 링크로 직접 진입 | `order/[id]/transfer/[token]/page.tsx` |
| TransferAccept / TransferDecline | `…/transfer/[token]/accept`, `…/decline` | 진입 즉시 수락·거절 API 호출 | `…/accept/page.tsx`, `…/decline/page.tsx` |
| Shipping / Returns / Terms / Privacy / Contact | `/{cc}/shipping` 등 | 정적 안내. 정책 미설정 시 안내 문구 | `(main)/{shipping,returns,terms,privacy,contact}/page.tsx` |
| NotFound | 각 그룹 `not-found.tsx` | `notFound()` 호출 또는 미정의 경로 | `app/not-found.tsx`, `(main)/not-found.tsx`, `(checkout)/not-found.tsx` |
| (add_form_handler) | `POST /{cc}/cart/add` | JavaScript 없는 상품 담기 폼 처리 | `(main)/cart/add/route.ts` |
| (buy_permalink) | `GET /buy/[items]` | 장바구니 생성 후 Checkout으로 303 | `app/buy/[items]/route.ts` |
| (cart_resume) | `GET /{cc}/cart/resume/[cartId]` | 열린 장바구니면 Checkout으로 303 | `(main)/cart/resume/[cartId]/route.ts` |
| (payment_return) | `GET /api/payment-return` | 외부 결제 복귀 판단 후 redirect | `app/api/payment-return/route.ts` |

### API 노드 대응

DSL 이름이 달라도 같은 HTTP 계약을 쓰는 노드가 있다. 한 그림 안에서 서로 다른 진입의 분기가 섞이지 않도록 호출 목적별로 노드 이름을 나눴다. 한 노드가 여러 호출을 순서대로 묶으면 `실제 호출`에 순서를 적었다.

| DSL 노드 | 실제 호출 | HTTP 계약 | 확인 |
| --- | --- | --- | --- |
| `(/store/regions)` | 미들웨어 `getRegionMap`의 `fetch`(1시간 캐시), 페이지의 `getRegion`·`listRegions` | `GET /store/regions` | 확인 |
| `(/store/collections)` | Home `listCollections` | `GET /store/collections` | 확인 |
| `(/store/collection_by_handle)` | `getCollectionByHandle` | `GET /store/collections?handle=` | 확인 |
| `(/store/category_by_handle)` | `getCategoryByHandle` | `GET /store/product-categories?handle=` | 확인 |
| `(/store/product_by_handle)` | `getRegion` → `listProducts({ handle })` | `GET /store/regions` → `GET /store/products?handle=&region_id=` | 확인 |
| `(/store/product_search)` | `getRegion` → 검색어가 있을 때 `listProducts({ q, limit: 24 })` | `GET /store/regions` → `GET /store/products?q=` | 확인 |
| `(/store/search)` | `SearchDrawer`의 InstantSearch `searchClient`(`@medusajs/instantsearch-adapter`) | 경로 `/store/search`, method 미확인 | 경로 확인 |
| `(/store/cart_add_item)` | Server Action `addToCart` → `getOrSetCart`(`getRegion`, `retrieveCart`, 없으면 `sdk.store.cart.create`, 지역이 다르면 `sdk.store.cart.update`) → `sdk.store.cart.createLineItem` | `GET /store/carts/{id}` → `POST /store/carts` 또는 `POST /store/carts/{id}` → `POST /store/carts/{id}/line-items` | GET 확인, 나머지 추정 |
| `(/store/cart_retrieve)` | `retrieveCart`(헤더 `CartButton`·`CartDropdown`·Cart 페이지), `payment-return`의 `sdk.client.fetch`, `cart/resume`의 `sdk.store.cart.retrieve` | `GET /store/carts/{id}` | 확인(`cart.retrieve`만 추정) |
| `(/store/product_retrieve)` | `cart/add` `resolveVariantId` → `sdk.store.product.retrieve` | `GET /store/products/{id}` | 추정 |
| `(/store/form_line_items)` | `cart/add` `addLineItem` → 쿠키 장바구니가 없으면 `sdk.store.cart.create` → `sdk.store.cart.createLineItem`. 기존 장바구니에서 실패하면 새 장바구니로 한 번 재시도 | `POST /store/carts` → `POST /store/carts/{id}/line-items` | 추정 |
| `(/store/cart_page_load)` | Cart 페이지 `retrieveCart` → `retrieveCustomer`(N03의 `(/store/cart_retrieve)` → `(/store/customer_me)`를 한 노드로 줄인 것) | `GET /store/carts/{id}` → `GET /store/customers/me` | 확인 |
| `(/store/customer_me)` | `retrieveCustomer`(계정 레이아웃·Cart·Checkout), `completeLogin`의 `sdk.store.customer.retrieve` | `GET /store/customers/me` | 확인(`customer.retrieve`만 추정) |
| `(/store/checkout_load)` | Checkout 페이지 `retrieveCart` → `retrieveCustomer` → `listCartShippingMethods` → `listCartPaymentMethods` | `GET /store/carts/{id}` → `GET /store/customers/me` → `GET /store/shipping-options?cart_id=` → `GET /store/payment-providers?region_id=` | 확인 |
| `(/store/cart_update)` | `setAddresses` → `updateCart` | `POST /store/carts/{id}` | 추정 |
| `(/store/shipping_method)` | `setShippingMethod` → `sdk.store.cart.addShippingMethod` | `POST /store/carts/{id}/shipping-methods` | 추정 |
| `(/store/payment_session_prepare)` | 결제 수단 선택 시 `setPaymentMethod` → Stripe 계열이면 `initiatePaymentSession` | `POST /store/payment-collections/{id}/payment-sessions` | 추정 |
| `(/store/payment_session)` | Continue to review의 `handleSubmit` → 선택 수단의 세션이 없을 때 `initiatePaymentSession` | `POST /store/payment-collections/{id}/payment-sessions` | 추정 |
| `(/stripe/confirm_payment)` | `StripePaymentButton` → Stripe.js `stripe.confirmPayment({ redirect: "if_required" })` | Stripe 외부 API | 외부·미확인 |
| `(/store/cart_complete)` | `placeOrder` → `sdk.store.cart.complete` | `POST /store/carts/{id}/complete` | 추정 |
| `(/store/adyen_payment)` | `submitAdyenPayment` → `getAdyenSession`(`GET` 장바구니) → `sdk.store.payment.updatePaymentSession` → `placeOrder` → 실패·추가 동작이면 `getAdyenSession` 재조회 | `GET /store/carts/{id}` → 결제 세션 갱신 → `POST /store/carts/{id}/complete` | GET 확인, 나머지 추정 |
| `(/store/order_retrieve)` | `retrieveOrder`(OrderConfirmed·OrderDetail) | `GET /store/orders/{id}` | 확인 |
| `(/store/orders_list)` | `listOrders`(AccountOverview·Orders) | `GET /store/orders` | 확인 |
| `(/store/product_variants)` | `/buy` `findMissingVariantIds` | `GET /store/product-variants?id=` | 확인 |
| `(/store/cart_create_with_items)` | `/buy` `createCartWithItems` → `sdk.store.cart.create` → 품목마다 `createLineItem` | `POST /store/carts` → `POST /store/carts/{id}/line-items` 반복 | 추정 |
| `(/auth/login)` / `(/auth/relogin)` | `login`·`completeLogin` → `sdk.auth.login`. `relogin`은 고객 생성 직후 고객이 연결된 토큰을 다시 받는 두 번째 호출 | `POST /auth/customer/emailpass` | 추정 |
| `(/auth/register)` | `signup` → `sdk.auth.register` | `POST /auth/customer/emailpass/register` | 추정 |
| `(/auth/verify_request)` | `requestVerificationEmail` → `sdk.auth.verification.request` | 미확인 | 미확인 |
| `(/auth/verify_confirm)` | `confirmEmailVerification` → `sdk.auth.verification.confirm` | 미확인 | 미확인 |
| `(/store/customer_create)` | `completeLogin` → `sdk.store.customer.create` | `POST /store/customers` | 추정 |
| `(/store/cart_transfer)` | `transferCart` → `sdk.store.cart.transferCart`(장바구니 쿠키가 있을 때만) | `POST /store/carts/{id}/customer` | 추정 |
| `(/auth/logout)` | `signout` → `sdk.auth.logout` | `DELETE /auth/session` | 추정 |
| `(/store/transfer_request)` | `createTransferRequest` | `POST /store/orders/{id}/transfer/request` | 추정 |
| `(/store/transfer_accept)` / `(/store/transfer_decline)` | `acceptTransferRequest` / `declineTransferRequest` | `POST /store/orders/{id}/transfer/accept` / `…/decline` | 추정 |
| `(/store/region_update)` | `updateRegion` → `getRegion` → 장바구니가 있으면 `updateCart({ region_id })` | `GET /store/regions` → `POST /store/carts/{id}` | GET 확인, POST 추정 |
| `(/store/region_policies)` | `getStorePolicies` → `listRegions` | `GET /store/regions` | 확인 |

### 화면 확인 링크 공통 사항

Navigation 단독 작업이라 화면 HTML·Layout을 만들지 않았고 기존 화면 자료도 없다. 각 시나리오 표의 `화면 확인` 열에는 `확인 불가`와 로컬 실행(`pnpm run storefront:dev`, `http://localhost:8000`) 시 열 경로를 적었다. 실행 확인은 하지 않았다.

## 전체 이동 요약

```navigation
Home --> Store : 상단·사이드 메뉴 Store
Home --> Collection : 컬렉션 레일 선택
Home --> Search : 검색 아이콘(JS 없음)·푸터 Search
Store --> ProductDetail : 상품 선택
Category --> ProductDetail : 상품 선택
Collection --> ProductDetail : 상품 선택
Search --> ProductDetail : 상품 선택
ProductDetail --> Cart : 장바구니 담기(JS 없음)·Cart 링크
Cart --> Checkout : Go to checkout
Cart --> AccountLogin : Sign in
Checkout --> Cart : Back to shopping cart
Checkout --> OrderConfirmed : 주문 완료
Checkout --> Cart : 외부 결제 실패 복귀
AccountLogin --> AccountOverview : 로그인 성공
AccountOverview --> Orders : 메뉴 Orders
Orders --> OrderDetail : See details
OrderDetail --> Orders : Back to overview
AccountOverview --> AccountLogin : Log out
VerifyAccount --> AccountLogin : Go to sign in
TransferRequest --> TransferRequest : 수락·거절(같은 페이지)
```

- 상품 탐색 → 상품 상세 → 장바구니 → 체크아웃 → 주문 완료가 주 흐름이다. 체크아웃 네 단계는 같은 `Checkout` 페이지의 `step` 쿼리로 전환된다.
- 계정 화면은 같은 `/account` 경로가 로그인 여부에 따라 `AccountLogin` 또는 대시보드를 표시한다.
- `VerifyAccount`, `TransferRequest`, `TransferAccept/Decline`, `/buy`, `/cart/resume`, `/api/payment-return`은 메일·외부 결제·에이전트 링크로 직접 들어온다.
- 헤더(Home·Account·Cart), 사이드 메뉴(Home·Store·Account·Cart), 푸터(카테고리·컬렉션·정책·Search)는 모든 `(main)` 페이지에서 공통으로 쓴다. 체크아웃 헤더는 Cart·Home 링크만 있다.

<a id="n01"></a>
## N01. 상품 찾기

```navigation
Home --> (/store/regions) : 메뉴 Store
(/store/regions) --> Store : 지역 있음
(/store/regions) --> NotFound : 지역 없음
Home --> (/store/collection_by_handle) : 컬렉션 레일 View all
ProductDetail --> (/store/collection_by_handle) : 컬렉션명 선택
(/store/collection_by_handle) --> Collection : 컬렉션 있음
(/store/collection_by_handle) --> NotFound : 컬렉션 없음
Home --> (/store/category_by_handle) : 푸터 카테고리 선택
Category --> (/store/category_by_handle) : 하위·상위 카테고리 선택
(/store/category_by_handle) --> Category : 카테고리 있음
(/store/category_by_handle) --> NotFound : 카테고리 없음
Home(SearchDrawer) --> (/store/search) : 검색어 입력
(/store/search) --> Home(SearchDrawer) : 결과·결과 없음·검색 오류
Home --> (/store/product_search) : 푸터 Search·검색 아이콘 JS 없음
Search --> (/store/product_search) : 검색어 제출 GET
(/store/product_search) --> Search : 결과·결과 없음·검색어 없음
(/store/product_search) --> NotFound : 지역 없음
Store --> (/store/product_by_handle) : 상품 카드 선택
Category --> (/store/product_by_handle) : 상품 카드 선택
Collection --> (/store/product_by_handle) : 상품 카드 선택
Search --> (/store/product_by_handle) : 결과 상품 선택
Home(SearchDrawer) --> (/store/product_by_handle) : 검색 결과 선택
(/store/product_by_handle) --> ProductDetail : 상품 있음
(/store/product_by_handle) --> NotFound : 지역·상품 없음
```

- 헤더 검색 아이콘은 JavaScript가 있으면 같은 페이지 위에 `SearchDrawer`를 열고, 없으면 `/{cc}/search`로 이동한다. 그림의 `Home(SearchDrawer)`는 어느 `(main)` 페이지에서나 열리는 같은 오버레이를 대표한다. 드로어는 입력할 때마다 InstantSearch 어댑터로 `/store/search`를 호출해 결과·결과 없음·오류를 같은 오버레이에 표시한다.
- `Search`는 진입할 때 지역을 찾고(없으면 `NotFound`), 검색어가 있을 때만 `GET /store/products?q=`로 최대 24개를 가져온다. 폼은 `GET /{cc}/search?q=`로 다시 제출되어 같은 페이지에 결과 또는 "No products match" 문구를 표시한다.
- `Store`는 진입할 때 지역만 확인한다. 상품 목록·검색·정렬·필터는 페이지 안의 InstantSearch(`/store/search`)가 URL 쿼리와 함께 갱신하며 페이지를 이동하지 않는다.
- 카테고리는 푸터 목록에서 들어오며 `Category` 안에서 상위·하위 카테고리로 이동한다. 이동할 때마다 handle로 카테고리를 다시 조회한다. 정렬·필터·페이지 이동은 같은 페이지의 쿼리(`sortBy`, `optionValueIds`, `page`)만 바꾸고 `GET /store/products`로 목록을 다시 받는다.
- 상품 상세는 진입할 때 지역과 handle로 상품을 조회하고, 없으면 `NotFound`를 표시한다. 컬렉션·카테고리도 handle 조회 결과가 없으면 `NotFound`다.

### 화면 확인 링크

| 페이지·장면 | 화면 확인 | Layout |
| --- | --- | --- |
| Home · 기본·검색 오버레이 | 확인 불가 — HTML 미작성. 실행 시 `/dk` | 없음 — Navigation 단독 작업 |
| Store · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk/store` | 없음 — Navigation 단독 작업 |
| Category · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk/categories/{handle}` | 없음 — Navigation 단독 작업 |
| Collection · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk/collections/{handle}` | 없음 — Navigation 단독 작업 |
| Search · 결과·결과 없음 | 확인 불가 — HTML 미작성. 실행 시 `/dk/search?q=shirt` | 없음 — Navigation 단독 작업 |
| ProductDetail · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk/products/{handle}` | 없음 — Navigation 단독 작업 |
| NotFound · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk/products/no-such-handle`, `/dk/categories/no-such-handle` | 없음 — Navigation 단독 작업 |

<a id="n02"></a>
## N02. 상품을 장바구니에 담기

```navigation
ProductDetail --> (select_variant) : 옵션 선택
(select_variant) --> ProductDetail : 유효하지 않은 조합, 버튼 비활성
(select_variant) --> (/store/cart_add_item) : Add to cart JS
(/store/cart_add_item) --> (/store/cart_retrieve) : 성공, 장바구니 캐시 무효화
(/store/cart_retrieve) --> ProductDetail(CartDropdown) : 품목 수 증가
ProductDetail(CartDropdown) --> Cart : Go to cart
ProductDetail --> (add_form_handler) : Add to cart JS 없음
(add_form_handler) --> (/store/regions) : 국가 코드 확인
(/store/regions) --> (/store/product_retrieve) : 옵션값 전달
(/store/regions) --> (/store/form_line_items) : variant_id 직접 전달
(/store/product_retrieve) --> (/store/form_line_items) : 옵션 조합과 일치하는 변형
(/store/form_line_items) --> Cart : 303 redirect
```

- JavaScript가 있으면 Server Action `addToCart`가 지역을 찾고 쿠키 장바구니를 조회한 뒤, 없으면 새로 만들고 지역이 다르면 장바구니 지역을 바꾼 다음 품목을 추가한다.
- 추가 후 장바구니 캐시가 무효화되고 `notifyCartUpdated` 이벤트가 발생하면 헤더의 `CartButton`·`CartDropdown`이 장바구니를 다시 조회한다. 품목 수가 늘어났고 현재 경로가 `/cart`가 아니면 드롭다운을 5초간 연다. 드롭다운의 Go to cart로 `Cart`에 간다.
- JavaScript가 없으면 같은 폼이 `POST /{cc}/cart/add`로 제출된다. 처리기는 지역을 찾고, 옵션값이 오면 상품을 조회해 일치하는 변형을 고른다. 쿠키 장바구니가 없으면 새로 만들어 품목을 추가하고 `Cart`로 303 이동한다. 기존 장바구니에 추가가 실패하면 새 장바구니로 한 번 다시 시도한다.
- 폼 처리기의 실패(국가 없음 404, 상품 조회 실패 404, 일치 변형 없음 400, 추가 실패 400)는 페이지가 아니라 평문 응답을 보여 준다. 그림에는 넣지 않았다.
- 옵션 선택은 `v_id` 쿼리만 바꾸며 페이지를 이동하지 않는다. `addToCart` 실패 시의 처리는 관찰 이슈 4를 참고한다.

### 화면 확인 링크

| 페이지·장면 | 화면 확인 | Layout |
| --- | --- | --- |
| ProductDetail · 기본·장바구니 드롭다운 | 확인 불가 — HTML 미작성. 실행 시 `/dk/products/{handle}` | 없음 — Navigation 단독 작업 |
| Cart · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk/cart` | 없음 — Navigation 단독 작업 |

<a id="n03"></a>
## N03. 장바구니에서 체크아웃 시작

```navigation
(check_cart_items) --> (/store/cart_retrieve) : 장바구니 쿠키
(/store/cart_retrieve) --> Cart(Empty) : 장바구니 없음·조회 실패·품목 없음
Cart(Empty) --> Store : Explore products
(/store/cart_retrieve) --> (/store/customer_me) : 품목 있음
(/store/customer_me) --> Cart(SignInPrompt) : 비로그인
(/store/customer_me) --> Cart : 로그인
Cart(SignInPrompt) --> AccountLogin : Sign in
Cart --> ProductDetail : 품목명 선택
Cart --> (resolve_checkout_step) : Go to checkout
(resolve_checkout_step) --> (/store/checkout_load) : step 쿼리 결정
(/store/checkout_load) --> NotFound : 장바구니 없음
(/store/checkout_load) --> Checkout(NoForm) : 배송·결제 수단 조회 실패
(/store/checkout_load) --> Checkout(Address) : step=address
(/store/checkout_load) --> Checkout(Delivery) : step=delivery
(/store/checkout_load) --> Checkout(Payment) : step=payment
Checkout --> Cart : Back to shopping cart
```

- `Cart` 진입·새로고침은 `check_cart_items`에서 시작한다. 쿠키의 장바구니를 조회해 없거나 조회에 실패하거나 품목이 없으면 빈 장바구니 장면을, 품목이 있으면 고객을 조회해 비로그인이면 Sign in 안내를 함께 표시한다.
- 장바구니 요약의 버튼은 이미 읽은 장바구니로 `getCheckoutStep`을 계산해 `step` 쿼리를 정한다. 주소·이메일이 없으면 `address`, 배송 방법이 없으면 `delivery`, 그 밖에는 `payment`다. 로그인은 필수가 아니다.
- `Checkout` 진입(직접 진입 포함)은 장바구니를 다시 조회해 없으면 `NotFound`, 있으면 고객·배송 수단·결제 수단을 조회한다. 배송 수단이나 결제 수단 조회가 실패하면 입력 폼 영역 없이 주문 요약만 보인다(관찰 이슈 9).
- 비로그인 사용자는 Sign in 안내에서 `AccountLogin`으로 이동한다. 로그인 후 장바구니로 자동 복귀하지 않는다(N08).
- 모든 `(main)` 페이지의 레이아웃은 고객·장바구니·배송 수단을 조회한다. 로그인 고객과 장바구니 소유자가 다르면 상단에 배너가 뜨고 "Run transfer again"이 장바구니 이전(`POST /store/carts/{id}/customer`, 추정)을 다시 호출한다. 화면 이동은 없다.

### 화면 확인 링크

| 페이지·장면 | 화면 확인 | Layout |
| --- | --- | --- |
| Cart · 기본·빈 장바구니·Sign in 안내 | 확인 불가 — HTML 미작성. 실행 시 `/dk/cart` | 없음 — Navigation 단독 작업 |
| Store · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk/store` | 없음 — Navigation 단독 작업 |
| ProductDetail · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk/products/{handle}` | 없음 — Navigation 단독 작업 |
| AccountLogin · 로그인 | 확인 불가 — HTML 미작성. 실행 시 `/dk/account` | 없음 — Navigation 단독 작업 |
| Checkout · 주소·배송·결제 단계·입력 폼 없음 | 확인 불가 — HTML 미작성. 실행 시 `/dk/checkout?step=address`, `?step=delivery`, `?step=payment` | 없음 — Navigation 단독 작업 |
| NotFound · 장바구니 없이 체크아웃 진입 | 확인 불가 — HTML 미작성. 실행 시 장바구니 쿠키 없이 `/dk/checkout` | 없음 — Navigation 단독 작업 |

<a id="n04"></a>
## N04. 체크아웃 단계 진행(주소 → 배송 → 결제)

```navigation
Checkout(Address) --> (/store/cart_update) : Continue to delivery
(/store/cart_update) --> Checkout(Address) : 오류 메시지
(/store/cart_update) --> (/store/checkout_load) : 성공, 배송 국가 경로로 redirect
(/store/checkout_load) --> Checkout(Delivery) : 장바구니·배송·결제 수단 조회
Checkout(Delivery) --> (/store/shipping_method) : 배송 방법 선택
(/store/shipping_method) --> Checkout(Delivery) : 저장·오류 메시지
Checkout(Delivery) --> Checkout(Payment) : Continue to payment, 저장된 방법 있음
Checkout(Payment) --> (/store/payment_session_prepare) : Stripe 계열 수단 선택
(/store/payment_session_prepare) --> Checkout(Payment) : 카드 입력 영역 표시·오류
Checkout(Payment) --> (check_active_session) : Continue to review
(check_active_session) --> Checkout(Review) : 선택 수단 세션 있음
(check_active_session) --> (/store/payment_session) : 세션 없음·수단 변경
(/store/payment_session) --> Checkout(Payment) : 오류·Stripe 카드 입력 필요
(/store/payment_session) --> Checkout(Review) : 세션 생성
Checkout(Review) --> Checkout(Address) : 주소 Edit
Checkout(Review) --> Checkout(Delivery) : 배송 Edit
Checkout(Review) --> Checkout(Payment) : 결제 Edit
```

- 주소 저장(`setAddresses`)은 장바구니를 갱신하고 성공하면 `/{배송지 국가}/checkout?step=delivery`로 서버 redirect한다. 새 경로의 `Checkout`은 장바구니·고객·배송 수단·결제 수단을 다시 조회한다. 배송 국가가 현재 경로의 국가와 다르면 URL 국가 코드도 바뀌고 미들웨어의 지역 판단을 다시 거친다(관찰 이슈 7).
- 배송 방법은 선택 즉시 장바구니에 저장된다. Continue to payment는 API 없이 저장된 방법이 있을 때만 결제 단계로 넘어간다.
- 결제 단계에서 Stripe 계열 수단을 고르면 그 자리에서 결제 세션을 만들고 같은 단계에 카드 입력 영역을 표시한다. 다른 수단은 선택만 하고 API를 호출하지 않는다.
- Continue to review는 선택 수단의 세션이 이미 있으면 API 없이 `step=review`로 이동한다. 세션이 없거나 수단이 바뀌었으면 세션을 만든 뒤, Stripe 계열인데 세션이 없던 경우는 같은 단계에 머물러 카드 정보를 받고 그 밖에는 `step=review`로 이동한다. 실패하면 결제 단계에 오류 메시지를 표시한다.
- 완료된 단계의 Edit은 API 없이 해당 `step`으로 돌아간다.

### 화면 확인 링크

| 페이지·장면 | 화면 확인 | Layout |
| --- | --- | --- |
| Checkout · 주소·배송·결제·검토·오류 | 확인 불가 — HTML 미작성. 실행 시 `/dk/checkout?step=address`, `?step=delivery`, `?step=payment`, `?step=review` | 없음 — Navigation 단독 작업 |

<a id="n05"></a>
## N05. 주문하기(결제 수단별)

```navigation
Checkout(Review) --> (select_provider) : Place order
(select_provider) --> (/store/cart_complete) : 수동 테스트 결제
(select_provider) --> (/stripe/confirm_payment) : Stripe 계열
(select_provider) --> (/store/adyen_payment) : Adyen Drop-in 제출
(/stripe/confirm_payment) --> (/store/cart_complete) : 인라인 승인 requires_capture·succeeded
(/stripe/confirm_payment) --> Checkout(Review) : 결제 오류 메시지
(/stripe/confirm_payment) --> (payment_return) : 외부 인증 후 복귀
(/store/adyen_payment) --> (/store/order_retrieve) : 주문 생성 redirect
(/store/adyen_payment) --> Checkout(Review) : 거절·오류 메시지·추가 동작 requires_more
Checkout(Review) --> (/store/adyen_payment) : Drop-in 추가 인증 완료
(/store/adyen_payment) --> (payment_return) : 은행 인증 redirect 후 복귀
(/store/cart_complete) --> (/store/order_retrieve) : 주문 생성 redirect
(/store/cart_complete) --> Checkout(Review) : 오류 메시지·주문 미생성 cart 반환
(/store/order_retrieve) --> OrderConfirmed : 주문 조회 성공
(/store/order_retrieve) --> NotFound : 주문 조회 실패
OrderConfirmed --> Home : 헤더 Home
```

- `placeOrder`가 장바구니를 완료해 주문이 생기면 장바구니 쿠키를 지우고 `/{배송 국가}/order/{id}/confirmed`로 redirect한다. `OrderConfirmed`는 진입할 때 주문을 다시 조회하고 실패하면 `NotFound`를 표시한다.
- 장바구니 완료 응답이 주문이 아니라 장바구니(`type: "cart"`)이면 `placeOrder`는 오류 없이 장바구니를 돌려주고, 결제 버튼은 메시지 없이 검토 단계에 머문다(관찰 이슈 10).
- Stripe는 Stripe.js `confirmPayment`를 `redirect: "if_required"`로 호출해 카드 결제를 인라인 처리하고, 결과가 `requires_capture`·`succeeded`이면 장바구니를 완료한다. 외부 인증이 필요한 수단만 사이트를 떠났다가 `/api/payment-return`으로 돌아온다(N06).
- Adyen Drop-in 제출은 서버에서 장바구니의 Adyen 세션을 조회·갱신하고 장바구니 완료를 시도한다. 결과가 추가 동작(3DS 등)이면 Drop-in 안에서 처리한 뒤 추가 정보로 같은 처리를 다시 호출하고, 은행 redirect가 필요하면 `/api/payment-return`으로 돌아온다.
- 그 밖의 실패는 검토 단계의 오류 메시지로 남고 페이지를 이동하지 않는다.

### 화면 확인 링크

| 페이지·장면 | 화면 확인 | Layout |
| --- | --- | --- |
| Checkout · 검토·결제 오류·Adyen 추가 인증 | 확인 불가 — HTML 미작성. 실행 시 `/dk/checkout?step=review` | 없음 — Navigation 단독 작업 |
| OrderConfirmed · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk/order/{id}/confirmed` | 없음 — Navigation 단독 작업 |
| NotFound · 주문 조회 실패 | 확인 불가 — HTML 미작성. 실행 시 `/dk/order/no-such-id/confirmed` | 없음 — Navigation 단독 작업 |
| Home · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk` | 없음 — Navigation 단독 작업 |

<a id="n06"></a>
## N06. 외부 결제창 복귀

```navigation
(payment_return) --> (/store/adyen_payment) : Adyen redirectResult 있음, 장바구니 쿠키 설정
(/store/adyen_payment) --> (/store/order_retrieve) : 주문 생성 redirect
(/store/adyen_payment) --> (/store/cart_page_load) : 그 외 error=payment_failed
(payment_return) --> (/store/cart_page_load) : 필수 파라미터 없음 error=payment_failed
(payment_return) --> (/store/cart_retrieve) : Stripe 파라미터 있음
(/store/cart_retrieve) --> (/store/cart_page_load) : 조회 실패·세션·client_secret 불일치 error=payment_failed
(/store/cart_retrieve) --> (/store/checkout_load) : 장바구니 쿠키 복원, redirect_status=failed
(/store/checkout_load) --> Checkout(Payment) : step=payment
(/store/cart_retrieve) --> (/store/cart_complete) : 장바구니 쿠키 복원, 결제 확인
(/store/cart_complete) --> (/store/order_retrieve) : 주문 생성 redirect
(/store/cart_complete) --> (/store/cart_page_load) : 완료 실패·주문 미생성 error=order_failed
(/store/order_retrieve) --> OrderConfirmed : 주문 조회 성공
(/store/order_retrieve) --> NotFound : 주문 조회 실패
(/store/cart_page_load) --> Cart : 남은 품목 있음
(/store/cart_page_load) --> Cart(Empty) : 장바구니 없음·품목 없음
```

- 외부 결제 제공자가 `/api/payment-return?cart_id=…&country_code=…`로 돌려보내면 Route Handler `payment_return`이 판단을 시작한다. 직접 접속 자체는 그림에 넣지 않았다.
- Adyen 복귀는 장바구니 쿠키를 먼저 설정하고 `redirectResult`로 Adyen 처리(세션 조회·갱신·장바구니 완료)를 호출한다. 주문이 생기면 확인 페이지로, 그 밖에는 `Cart`로 보낸다.
- Stripe 복귀는 장바구니를 `no-store`로 조회해 결제 세션과 `payment_intent`·`client_secret`이 일치할 때만 장바구니 쿠키를 복원한다. 결제 실패면 `step=payment`로 돌아가 체크아웃 데이터를 다시 조회하고 다른 수단을 고를 수 있다. 그 밖에는 장바구니를 완료한다.
- 실패 복귀는 모두 `Cart`에 `error` 쿼리를 붙인다. `Cart`는 진입할 때 쿠키 장바구니와 고객을 조회해 기본 또는 빈 장바구니 장면을 보여 주며, `error` 쿼리는 읽지 않는다(관찰 이슈 1). 그림의 `(/store/cart_page_load)`는 N03의 `Cart` 진입 조회와 같은 호출이다.

### 화면 확인 링크

| 페이지·장면 | 화면 확인 | Layout |
| --- | --- | --- |
| OrderConfirmed · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk/order/{id}/confirmed` | 없음 — Navigation 단독 작업 |
| Cart · 결제·주문 실패 복귀·빈 장바구니 | 확인 불가 — HTML 미작성. 실행 시 `/dk/cart?error=payment_failed`, `/dk/cart?error=order_failed` | 없음 — Navigation 단독 작업 |
| Checkout · 결제 단계 | 확인 불가 — HTML 미작성. 실행 시 `/dk/checkout?step=payment` | 없음 — Navigation 단독 작업 |
| NotFound · 주문 조회 실패 | 확인 불가 — HTML 미작성. 실행 시 `/dk/order/no-such-id/confirmed` | 없음 — Navigation 단독 작업 |

<a id="n07"></a>
## N07. 장바구니 링크로 바로 결제하기

```navigation
(buy_permalink) --> (/store/regions) : 품목 형식 정상
(/store/regions) --> (/store/product_variants) : 배송 가능 국가
(/store/product_variants) --> (/store/cart_create_with_items) : 모든 변형 존재
(/store/cart_create_with_items) --> (/store/checkout_load) : 장바구니 쿠키 설정 후 303
(cart_resume) --> (/store/cart_retrieve) : cartId
(/store/cart_retrieve) --> (/store/checkout_load) : 열린 장바구니, 쿠키 설정 후 303
(/store/checkout_load) --> Checkout : 장바구니 있음
```

- AI 에이전트나 외부 링크가 `/buy/{variant_id}:{quantity},...?context/address_country=`로 들어오면 `buy_permalink`가 품목 형식을 검사하고, 지역 목록에서 요청 국가(없으면 기본 국가)의 지역을 찾고, 변형 목록 조회로 없는 변형을 확인한 뒤 새 장바구니를 만들어 품목을 하나씩 추가한다. 그 다음 해당 국가의 `Checkout`으로 303 이동한다.
- 에이전트가 만든 장바구니는 `/{cc}/cart/resume/{cartId}`로 넘겨받는다. 장바구니를 조회해 완료·취소되지 않았으면 쿠키에 설정하고 `Checkout`으로 보낸다.
- 도착한 `Checkout`은 N03과 같이 장바구니·고객·배송 수단·결제 수단을 조회한다. 단계 쿼리가 없으므로 단계 표시는 체크아웃 화면의 기본 처리에 따른다.
- 형식 오류(400), 배송 불가 국가(400), 없는 변형(404), 장바구니 생성·품목 추가 실패(400), 조회 실패·완료·취소된 장바구니(410)는 페이지가 아니라 평문 응답이다.

### 화면 확인 링크

| 페이지·장면 | 화면 확인 | Layout |
| --- | --- | --- |
| Checkout · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/buy/{variant_id}:1` 진입 후 `/{cc}/checkout` | 없음 — Navigation 단독 작업 |

<a id="n08"></a>
## N08. 로그인·회원가입·이메일 인증

```navigation
AccountLogin(SignIn) --> AccountLogin(Register) : Join us
AccountLogin(Register) --> AccountLogin(SignIn) : Sign in
AccountLogin(SignIn) --> (/auth/login) : Sign in
AccountLogin(Register) --> (/auth/register) : Join
(/auth/register) --> AccountLogin(Register) : 오류 메시지
(/auth/register) --> (/auth/login) : 등록됨·기존 identity, 가입 정보 쿠키 저장
(/auth/login) --> AccountLogin(SignIn) : 오류 메시지·지원하지 않는 인증 단계
(/auth/login) --> (/auth/verify_request) : verification_required
(/auth/verify_request) --> AccountLogin(VerificationSent) : 발송 성공·실패 모두
(/auth/login) --> (/store/customer_me) : 토큰 발급
(/store/customer_me) --> (/store/customer_create) : 토큰에 고객 레코드 없음
(/store/customer_create) --> (/auth/relogin) : 고객 생성
(/store/customer_create) --> AccountLogin(SignIn) : 오류 메시지
(/auth/relogin) --> AccountLogin(SignIn) : 오류 메시지
(/auth/relogin) --> (/store/cart_transfer) : 고객 토큰 저장
(/store/customer_me) --> (/store/cart_transfer) : 고객 있음, 토큰 저장
(/store/cart_transfer) --> AccountOverview : 성공·장바구니 없음·이전 실패, 같은 URL 재렌더
(read_verify_token) --> VerifyAccount(Error) : token 없음
(read_verify_token) --> (/auth/verify_confirm) : token 있음
(/auth/verify_confirm) --> VerifyAccount(Success) : 확인 성공
(/auth/verify_confirm) --> VerifyAccount(Error) : 무효·만료
VerifyAccount(Success) --> AccountLogin(SignIn) : Go to sign in
VerifyAccount(Error) --> AccountLogin(SignIn) : Go to sign in
```

- 로그인과 회원가입은 같은 `/account` 경로의 컴포넌트 전환이다. 회원가입은 identity를 등록하고(이미 있는 identity는 허용) 이름·전화번호를 쿠키에 보관한 뒤 같은 로그인 처리로 이어진다. 회원가입에서 이어진 로그인의 오류는 회원가입 폼에 표시된다.
- 로그인 응답이 이메일 인증을 요구하면 인증 메일 발송을 요청하고(실패는 무시) 같은 화면에 안내를 표시한다.
- 토큰을 받으면 `GET /store/customers/me`로 고객 레코드가 있는지 확인한다. 없으면 보관한 가입 정보로 고객을 만들고 다시 로그인해 고객이 연결된 토큰을 받는다. 고객 생성·재로그인 실패는 오류 메시지로 남는다.
- 토큰을 저장하고 고객 캐시를 무효화한 뒤 쿠키 장바구니가 있으면 고객에게 이전한다. 같은 URL이 대시보드 슬롯으로 다시 렌더링되고, 비로그인 상태로 열었던 `/account/orders` 같은 하위 경로라면 그 페이지가 바로 보인다. 장바구니 이전 실패 시 반환하는 오류 메시지는 로그인 폼이 대시보드로 바뀌면서 보이지 않을 수 있다(관찰 이슈 11, 실행 미확인).
- 메일 링크 `/{cc}/verify-account?token=`으로 들어오면 클라이언트 컴포넌트가 `token`을 읽는 `read_verify_token`에서 시작한다. 토큰이 있으면 한 번만 확인 API를 호출한다. 직접 진입 자체는 그림에 넣지 않았다.
- 인증 성공 후 고객 레코드는 다음 로그인의 고객 확인·생성 단계에서 만들어진다.

### 화면 확인 링크

| 페이지·장면 | 화면 확인 | Layout |
| --- | --- | --- |
| AccountLogin · 로그인·회원가입·인증 메일 발송·오류 | 확인 불가 — HTML 미작성. 실행 시 `/dk/account`(비로그인) | 없음 — Navigation 단독 작업 |
| AccountOverview · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk/account`(로그인) | 없음 — Navigation 단독 작업 |
| VerifyAccount · 확인 중·성공·오류 | 확인 불가 — HTML 미작성. 실행 시 `/dk/verify-account?token={token}` | 없음 — Navigation 단독 작업 |

<a id="n09"></a>
## N09. 계정 화면 이동·주문 조회·로그아웃

```navigation
(check_customer) --> (/store/customer_me) : 인증 토큰 쿠키 있음
(check_customer) --> AccountLogin : 토큰 없음
(/store/customer_me) --> AccountLogin : 조회 실패·비로그인
(/store/customer_me) --> (/store/orders_list) : 로그인, /account·/account/orders
(/store/orders_list) --> AccountOverview : /account, 주문 조회 실패도 표시
(/store/orders_list) --> Orders : /account/orders
(/store/orders_list) --> Orders(Empty) : 주문 없음
(/store/customer_me) --> (/store/regions) : 로그인, /account/profile·/account/addresses
(/store/regions) --> Profile : Profile
(/store/regions) --> Addresses : Addresses
(/store/regions) --> NotFound : 지역 없음
(/store/customer_me) --> (/store/order_retrieve) : 로그인, /account/orders/details/id
(/store/order_retrieve) --> OrderDetail : 주문 조회 성공
(/store/order_retrieve) --> NotFound : 주문 조회 실패
AccountOverview --> (check_customer) : 메뉴 Profile·Addresses·Orders·최근 주문 선택
Orders --> (check_customer) : See details
OrderDetail --> (check_customer) : Back to overview
Orders(Empty) --> Home : Continue shopping
AccountOverview --> (/auth/logout) : Log out
(/auth/logout) --> (check_customer) : 토큰·장바구니 쿠키 삭제 후 redirect /account
```

- `/account/*` 진입·새로고침·계정 메뉴 이동은 모두 계정 레이아웃의 `check_customer`에서 시작한다. 인증 토큰 쿠키가 없으면 API 없이, 있으면 `GET /store/customers/me` 결과로 로그인 여부를 정한다. 비로그인이면 어떤 하위 경로든 로그인 화면을 보여 준다.
- 로그인 상태에서는 대시보드 슬롯의 각 페이지가 자기 데이터를 다시 조회한다. 개요는 고객과 주문 목록(실패해도 빈 목록처럼 표시), 주문 목록은 주문 목록, 프로필은 고객과 지역 목록, 주소는 고객과 현재 국가의 지역, 주문 상세는 주문을 조회한다.
- 개요·프로필·주소 페이지는 고객 재조회 결과가 없으면 `NotFound`, 주문 상세는 다른 고객의 주문 ID 등 조회 실패 시 `NotFound`를 표시한다. 주문 목록 조회가 실패하면 `listOrders`가 예외를 던지고 별도 `error.tsx`가 없어 Next.js 기본 오류 화면이 나온다(관찰 이슈 12, 실행 미확인).
- 계정 메뉴의 화면 간 이동은 그림에서 `check_customer`로 되돌아가는 화살표로 표현했다. 도착 페이지는 위 조회 분기의 URL 조건으로 정해진다. 프로필·주소 수정은 같은 페이지 안에서 처리하며 이동하지 않는다.
- 로그아웃은 로그아웃 API를 호출하고 인증 토큰과 장바구니 쿠키를 지운 뒤 `/{cc}/account`로 redirect한다. 토큰이 없으므로 로그인 화면이 표시된다.

### 화면 확인 링크

| 페이지·장면 | 화면 확인 | Layout |
| --- | --- | --- |
| AccountLogin · 로그인 | 확인 불가 — HTML 미작성. 실행 시 `/dk/account`(비로그인) | 없음 — Navigation 단독 작업 |
| AccountOverview · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk/account` | 없음 — Navigation 단독 작업 |
| Profile · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk/account/profile` | 없음 — Navigation 단독 작업 |
| Addresses · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk/account/addresses` | 없음 — Navigation 단독 작업 |
| Orders · 기본·주문 없음 | 확인 불가 — HTML 미작성. 실행 시 `/dk/account/orders` | 없음 — Navigation 단독 작업 |
| OrderDetail · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk/account/orders/details/{id}` | 없음 — Navigation 단독 작업 |
| NotFound · 주문 조회 실패 | 확인 불가 — HTML 미작성. 실행 시 `/dk/account/orders/details/no-such-id`(로그인) | 없음 — Navigation 단독 작업 |
| Home · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk` | 없음 — Navigation 단독 작업 |

<a id="n10"></a>
## N10. 주문 소유권 이전 요청·수락·거절

```navigation
Orders --> (/store/transfer_request) : 주문 ID 입력 후 요청
(/store/transfer_request) --> Orders(TransferError) : 오류
(/store/transfer_request) --> Orders(TransferSent) : 요청 완료
TransferRequest --> (/store/transfer_accept) : Accept transfer
TransferRequest --> (/store/transfer_decline) : Decline transfer
(/store/transfer_accept) --> TransferRequest(Result) : 버튼 요청 성공·오류
(/store/transfer_decline) --> TransferRequest(Result) : 버튼 요청 성공·오류
(render_transfer_accept) --> (/store/transfer_accept) : accept 경로 진입, id·token
(render_transfer_decline) --> (/store/transfer_decline) : decline 경로 진입, id·token
(/store/transfer_accept) --> TransferAccept(Result) : 렌더링 중 요청 성공·오류
(/store/transfer_decline) --> TransferDecline(Result) : 렌더링 중 요청 성공·오류
```

- 로그인 고객은 `Orders` 하단 폼에서 게스트 주문의 이전을 요청한다. 결과는 같은 페이지에 표시되며 이동하지 않는다.
- 원래 주문자는 메일 링크 `/{cc}/order/{id}/transfer/{token}`으로 `TransferRequest`에 들어온다. 이 페이지는 진입할 때 API를 호출하지 않고 경로의 `id`만 표시한다. 버튼으로 수락·거절하면 결과가 같은 페이지에 표시된다.
- `…/accept`, `…/decline` 경로를 직접 열면 서버 컴포넌트(`render_transfer_accept`·`render_transfer_decline`)가 경로의 `id`·`token`으로 렌더링 중 바로 API를 호출하고 결과 문구만 표시한다. 두 페이지에는 다른 화면으로 가는 링크가 없다(관찰 이슈 5).

### 화면 확인 링크

| 페이지·장면 | 화면 확인 | Layout |
| --- | --- | --- |
| Orders · 이전 요청 완료·오류 | 확인 불가 — HTML 미작성. 실행 시 `/dk/account/orders` | 없음 — Navigation 단독 작업 |
| TransferRequest · 기본·결과 | 확인 불가 — HTML 미작성. 실행 시 `/dk/order/{id}/transfer/{token}` | 없음 — Navigation 단독 작업 |
| TransferAccept · 성공·오류 | 확인 불가 — HTML 미작성. 실행 시 `/dk/order/{id}/transfer/{token}/accept` | 없음 — Navigation 단독 작업 |
| TransferDecline · 성공·오류 | 확인 불가 — HTML 미작성. 실행 시 `/dk/order/{id}/transfer/{token}/decline` | 없음 — Navigation 단독 작업 |

<a id="n11"></a>
## N11. 국가 진입과 국가 변경

```navigation
(country_guard) --> (/store/regions) : 지역 맵 캐시 없음·1시간 경과
(country_guard) --> (/store/collections) : 캐시된 지역 맵으로 통과·/ rewrite
(/store/regions) --> (/store/collections) : 국가 코드 포함 경로 통과·/ 기본 국가 rewrite
(/store/collections) --> Home : 지역·컬렉션 있음
(/store/collections) --> Home(Empty) : 지역·컬렉션 없음
Home --> (/store/region_update) : 사이드 메뉴 국가 선택
(/store/region_update) --> (country_guard) : 새 국가 경로로 redirect
```

- 모든 사용자 경로는 미들웨어 `country_guard`가 처리한다. 지역 맵이 비었거나 1시간이 지났으면 `GET /store/regions`로 다시 만든다. 이 요청이 실패하면 미들웨어가 예외를 던지며 대체 화면은 없다.
- 첫 세그먼트가 지역에 있는 국가면 그대로, `/`면 기본 국가(`NEXT_PUBLIC_DEFAULT_REGION`, 없으면 첫 지역)를 rewrite로 보여 준다. 그 밖의 경로는 `/{country}{path}`로 307 redirect해 다시 `country_guard`를 거친다. 그림은 홈을 대표로 그렸고, 다른 페이지도 같은 방식으로 통과한 뒤 각 시나리오의 진입 조회를 한다.
- `Home`은 진입할 때 현재 국가의 지역과 컬렉션 목록을 조회한다. 둘 중 하나라도 없으면 본문 없이 빈 화면(`null`)을 반환한다.
- 사이드 메뉴의 국가 선택은 지역을 찾고, 장바구니가 있으면 장바구니 지역을 바꾼 뒤 `/{새 국가}{현재 경로}`로 redirect한다. 현재 페이지가 새 국가 경로로 미들웨어를 다시 거쳐 열린다.
- 언어 선택은 `router.refresh()`로 같은 페이지를 다시 그리며 이동하지 않는다.

### 화면 확인 링크

| 페이지·장면 | 화면 확인 | Layout |
| --- | --- | --- |
| Home · 기본·사이드 메뉴·빈 화면 | 확인 불가 — HTML 미작성. 실행 시 `/`, `/dk`. 빈 화면은 컬렉션이 없는 백엔드에서 `/dk` | 없음 — Navigation 단독 작업 |

<a id="n12"></a>
## N12. 정책·안내 페이지 보기

```navigation
Home --> (/store/region_policies) : 푸터 Shipping·Returns
(/store/region_policies) --> Shipping : Shipping 선택, 지역 정책 있음·없음 안내
(/store/region_policies) --> Returns : Returns 선택, 지역 정책 있음·없음 안내
Home --> Terms : 푸터 Terms
Home --> Privacy : 푸터 Privacy
Home --> Contact : 푸터 Contact
OrderConfirmed --> Contact : Help의 Contact·Returns & Exchanges
OrderDetail --> Contact : Help의 Contact·Returns & Exchanges
```

- 푸터는 모든 `(main)` 페이지에 있으므로 Home은 출발 페이지를 대표한다. 배송·반품 페이지는 진입할 때 지역 목록을 조회해 현재 국가 지역의 정책을 읽고, 정책이 없으면 안내 문구를 표시한다.
- 약관·개인정보·문의 페이지는 placeholder 문구를 포함한 정적 페이지다.

### 화면 확인 링크

| 페이지·장면 | 화면 확인 | Layout |
| --- | --- | --- |
| Home · 푸터 | 확인 불가 — HTML 미작성. 실행 시 `/dk` | 없음 — Navigation 단독 작업 |
| Shipping · 기본·정책 없음 | 확인 불가 — HTML 미작성. 실행 시 `/dk/shipping` | 없음 — Navigation 단독 작업 |
| Returns · 기본·정책 없음 | 확인 불가 — HTML 미작성. 실행 시 `/dk/returns` | 없음 — Navigation 단독 작업 |
| Terms · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk/terms` | 없음 — Navigation 단독 작업 |
| Privacy · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk/privacy` | 없음 — Navigation 단독 작업 |
| Contact · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk/contact` | 없음 — Navigation 단독 작업 |
| OrderConfirmed · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk/order/{id}/confirmed` | 없음 — Navigation 단독 작업 |
| OrderDetail · 기본 | 확인 불가 — HTML 미작성. 실행 시 `/dk/account/orders/details/{id}` | 없음 — Navigation 단독 작업 |

## 미확인 사항과 관찰 이슈

### 미확인

- `@medusajs/js-sdk`가 설치되지 않아 SDK 메서드의 HTTP 경로를 확인하지 못했다(API 노드 대응표의 `추정`·`미확인`).
- 이메일 인증·주문 이전 메일의 링크 주소는 백엔드·이메일 제공자 설정에서 만들어지며 이 저장소 코드에서 생성 위치를 찾지 못했다.
- Stripe가 외부 인증 후 복귀하는 조건, Adyen 3DS·redirect 조건은 결제 제공자 설정에 따라 달라 실제 실행으로 확인하지 않았다.

### 관찰 이슈

1. **결제 실패 복귀 메시지 없음**: `/api/payment-return`은 `Cart?error=payment_failed|order_failed`로 보내지만 `Cart` 페이지(`(main)/cart/page.tsx`, `modules/cart/templates`)가 `error` 쿼리를 읽지 않아 사용자는 실패 이유 없이 장바구니만 본다.
2. **로그인 후 원래 화면 복귀 없음**: `Cart`의 Sign in으로 `AccountLogin`에 가면 로그인 성공 후 계정 개요에 머문다. 장바구니·체크아웃으로 돌아가는 처리가 없다.
3. **없는 경로로 가는 링크**: 회원가입 화면의 `/content/privacy-policy`, `/content/terms-of-use`(`modules/account/components/register/index.tsx`)와 계정 레이아웃의 `/customer-service`(`modules/account/templates/account-layout.tsx`)에 대응하는 라우트가 없어 `NotFound`로 간다. 실제 정책 페이지는 `/privacy`, `/terms`, `/contact`다.
4. **JS 상품 담기 오류 처리 없음**: `ProductActions.handleAddToCart`가 `addToCart` 예외를 잡지 않아 실패 시 오류 안내가 없고 로딩 상태(`isAdding`)가 풀리지 않는다.
5. **GET 진입만으로 이전 수락·거절**: `…/transfer/{token}/accept`, `…/decline` 페이지는 렌더링 중 상태 변경 API를 호출한다. 링크 미리보기·프리페치·재방문만으로 실행될 수 있고, 결과 화면에 다른 페이지로 가는 링크도 없다.
6. **평문 오류 응답**: `/{cc}/cart/add`, `/buy/[items]`, `/cart/resume/[cartId]`의 실패는 스토어 화면이 아닌 평문을 보여 주며 복귀 링크가 없다.
7. **체크아웃 국가 경로 변경**: 주소 저장 후 redirect가 배송지 국가 코드를 쓰므로, 현재 경로 국가와 배송 국가가 다르면 URL 국가가 바뀐다. 해당 국가가 지역에 없으면 미들웨어가 다시 기본 국가로 redirect할 수 있다(실행 미확인).
8. **온보딩용 로컬 주소 링크**: 상품·주문 완료 화면의 온보딩 CTA가 `http://localhost:7001/a/orders…`로 고정되어 있다(`lib/data/onboarding.ts`, `product-onboarding-cta`). 온보딩 쿠키가 있을 때만 보인다.
9. **체크아웃 입력 폼이 조용히 사라짐**: `CheckoutForm`은 배송 수단(`GET /store/shipping-options`)이나 결제 수단(`GET /store/payment-providers`) 조회가 실패하면 `null`을 반환한다(`modules/checkout/templates/checkout-form/index.tsx`). 사용자는 오류 안내 없이 주문 요약만 본다.
10. **주문 미생성 응답에 안내 없음**: `placeOrder`는 장바구니 완료 응답이 `type: "cart"`이면 오류 없이 장바구니를 반환한다(`lib/data/cart.ts`). 수동·Stripe 결제 버튼은 이 반환값을 확인하지 않아 메시지 없이 검토 단계에 머문다.
11. **로그인 후 장바구니 이전 실패 메시지가 가려질 수 있음**: `completeLogin`은 토큰 저장·고객 캐시 무효화 후 `transferCart` 실패를 오류 상태로 반환한다. 같은 렌더링에서 계정 레이아웃이 대시보드 슬롯으로 바뀌므로 로그인 폼의 오류 메시지가 보이지 않을 수 있다. 실행 미확인이며, 이후 `(main)` 레이아웃의 장바구니 불일치 배너로 복구할 수 있다.
12. **주문 목록 조회 실패 시 기본 오류 화면**: `Orders` 페이지는 `listOrders`가 `medusaError`로 던진 예외를 잡지 않고, 저장소에 `error.tsx`가 없어 Next.js 기본 오류 화면이 나온다. 반면 개요 페이지는 같은 실패를 `null`로 처리한다.

## 검증

- 모든 화면 노드를 라우트 맵의 실제 `page.tsx`와 대조했다. `SearchDrawer`·`CartDropdown`·체크아웃 단계·로그인/회원가입은 라우트 없는 장면이라 `Page(장면)` 표기로 소속 페이지에 붙였다.
- 직접 진입(`/`, 메일 링크, `/buy`, `/cart/resume`, `/api/payment-return`, `/account/*` 새로고침, `Cart` 진입, `verify-account`, `…/transfer/{token}/accept·decline`)은 처리 노드에서 시작하고 진입 주소는 본문에 적었다. 진입 즉시 API를 호출하는 경우도 처리 노드 다음에 API 노드를 두었다.
- 시나리오 그림(전체 이동 요약 제외)에서 이동·도착 장면·`NotFound`를 결정하는 호출을 다시 찾아 그렸다. 대상은 페이지 진입 조회(`getRegion`·handle 조회·`retrieveCart`·`retrieveCustomer`·`retrieveOrder`·`listOrders`·체크아웃 배송/결제 수단), 미들웨어 지역 조회, Route Handler 내부 조회(`/store/product-variants`, 상품·장바구니 조회), 로그인 내부 호출(인증 메일 요청·고객 확인·생성·재로그인·장바구니 이전), Stripe.js `confirmPayment`, Adyen 세션 조회·갱신이다. 근거는 `src/middleware.ts`, `src/app/**/page.tsx`·`route.ts`, `src/lib/data/*`, `src/lib/util/server-cart.ts`, `modules/checkout/components/*`, `modules/layout/components/cart-dropdown`이다.
- 화면 이동을 결정하지 않는 호출(상품 목록 정렬·필터·페이지, `Store`의 InstantSearch 목록, 품목 수량 변경·삭제, 프로모션 코드, 프로필·주소 수정, 무료 배송 안내용 배송 수단 조회)은 그림에 넣지 않고 필요한 곳만 본문에 적었다.
- 시나리오 라벨의 괄호를 가이드 규칙에 맞게 쉼표·띄어쓰기로 바꿨다.
- 각 시나리오의 그림·본문에 등장하는 페이지를 `화면 확인 링크` 표와 대조했다. 화면 자료가 없어 모든 행이 `확인 불가`이다.
- DSL은 가이드 문법과 정적으로 대조했다. 렌더러로 그려 보지 않았고, 앱 실행 확인도 하지 않았다.
