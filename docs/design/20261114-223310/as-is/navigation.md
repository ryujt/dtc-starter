# Medusa DTC 스토어프론트 AS-IS Navigation

## 범위·확인 기준

- 대상: `apps/storefront`의 구매자 화면 25개 페이지 전체(목록은 [screen-layout.md](screen-layout.md#전체-페이지장면-목록)). 기준 커밋 `44f2979`.
- 코드만 읽은 정적 분석이다. 앱 실행·브라우저 관찰을 하지 않았다. 분석 근거·API 대응·미확인은 [system-design-as-is.md](system-design-as-is.md)에 모았다.
- 모든 경로 앞에 `/{countryCode}`가 붙는다(예: `/dk/cart`). 화면 노드는 실제 라우트 페이지이고, 라우트 없는 오버레이·단계·오류는 `Page(장면)`으로 표기한다.
- API 노드는 논리 이름이다. 실제 호출 대응은 [system.md](details/job-flow/system.md#그-밖의-서비스-간-호출)에 있다. 화면 HTML은 예시 데이터로 장면을 바꾸며 서버를 호출하지 않는다.

<a id="n01"></a>
## N01. 국가 진입과 국가 변경

```navigation
(country_guard) --> Home : / 접속(기본 국가 rewrite)
(country_guard) --> Home : /{cc} 접속(통과)
Home --> Home(SideMenu) : Menu
Home(SideMenu) --> (/store/region_update) : Shipping to 국가 선택
(/store/region_update) --> Home : /{새 국가}{현재 경로}로 redirect
```

- 모든 사용자 경로는 미들웨어(`country_guard`)를 거친다. 첫 세그먼트가 백엔드 지역의 국가면 통과, `/`면 기본 국가(`dk`) 홈을 같은 주소로 보여 준다. 그 밖의 경로는 `/{국가}{경로}`로 307 redirect한다. 그림은 홈을 대표로 그렸다.
- 사이드 메뉴의 국가 선택은 장바구니 지역을 바꾸고 현재 페이지를 새 국가 경로로 다시 연다. 언어 선택은 같은 페이지를 새로 그릴 뿐 이동하지 않는다.
- 사이드 메뉴의 Home·Store·Account·Cart는 각 페이지로 이동한다.

### 화면 확인 링크

| 페이지·장면 | 화면 HTML | Layout |
| --- | --- | --- |
| Home · 사이드 메뉴 | [기본](details/screens/home.html#default) · [사이드 메뉴](details/screens/home.html#side-menu) | [배치·장면](screen-layout.md#home) |

<a id="n02"></a>
## N02. 상품 목록 탐색

```navigation
Home --> Collection : 컬렉션 레일 View all
Home --> Store : 사이드 메뉴 Store
Home --> Category : 푸터 카테고리
Home --> ProductDetail : 상품 카드
Store --> (/store/search) : 검색어·필터·정렬·페이지
(/store/search) --> Store(Filtered) : 결과 있음
(/store/search) --> Store(NoResults) : 결과 없음
Store --> ProductDetail : 상품 카드
Category --> Category(Child) : 하위 카테고리
Category(Child) --> Category : 상위 카테고리
Category --> ProductDetail : 상품 카드
Collection --> ProductDetail : 상품 카드
```

- 홈은 컬렉션별 상품 레일을 보여 준다. 지역이나 컬렉션이 없으면 본문이 빈다.
- Store는 InstantSearch로 `/store/search`를 부르며 정렬·옵션·가격·카테고리 필터와 검색어·페이지를 URL 쿼리(`routing`)에 반영한다. 같은 페이지 안의 장면 변화다.
- Category·Collection은 서버에서 상품을 조회하고 정렬·옵션 필터·페이지를 쿼리로 바꾼다. 없는 핸들이면 [NotFound](#n19)다. 상품이 없으면 빈 목록이 보인다.

### 화면 확인 링크

| 페이지·장면 | 화면 HTML | Layout |
| --- | --- | --- |
| Home · 기본 | [기본](details/screens/home.html#default) | [배치·장면](screen-layout.md#home) |
| Store · 필터 적용·결과 없음·2페이지 | [기본](details/screens/store.html#default) · [필터 적용](details/screens/store.html#filtered) · [결과 없음](details/screens/store.html#no-results) · [2페이지](details/screens/store.html#page-2) | [배치·장면](screen-layout.md#store) |
| Category · 하위 카테고리·상품 없음 | [기본](details/screens/category.html#default) · [하위 카테고리](details/screens/category.html#child) · [상품 없음](details/screens/category.html#empty) | [배치·장면](screen-layout.md#category) |
| Collection · 상품 없음 | [기본](details/screens/collection.html#default) · [상품 없음](details/screens/collection.html#empty) | [배치·장면](screen-layout.md#collection) |
| ProductDetail · 기본 | [기본](details/screens/product-detail.html#default) | [배치·장면](screen-layout.md#product-detail) |

<a id="n03"></a>
## N03. 상품 검색

```navigation
Home --> (check_search_region) : 푸터 Search 또는 JavaScript 없이 헤더 검색 아이콘 선택
Search --> (check_search_region) : 검색어 입력 후 제출
Search(ProductResults) --> (check_search_region) : 검색어를 바꿔 다시 제출
Search(NoResults) --> (check_search_region) : 검색어를 바꿔 다시 제출
(check_search_region) --> NotFound : URL의 국가 코드에 해당하는 판매 지역 없음
(check_search_region) --> Search : 판매 지역 있음·검색어 없음, 검색창 표시
(check_search_region) --> (/store/products) : 판매 지역 있음·검색어 있음, 키워드와 지역 ID 전달
(/store/products) --> Search(ProductResults) : 일치 상품 있음, 결과 목록 표시
(/store/products) --> Search(NoResults) : 일치 상품 없음, 안내와 검색창 표시
Search(ProductResults) --> (/store/product_by_handle) : 결과 목록에서 상품 카드 선택
(/store/product_by_handle) --> ProductDetail : 상품 있음
(/store/product_by_handle) --> NotFound : 판매 지역 또는 상품 없음
```

- 헤더 검색 아이콘은 JavaScript가 있으면 현재 페이지 위에 검색 드로어를 연다. 그림의 `Home(SearchDrawer)`는 모든 `(main)` 페이지에서 열리는 같은 오버레이를 대표한다.
- JavaScript가 없거나 푸터 Search를 누르면 `/{cc}/search`로 이동한다. 폼은 `GET ?q=`로 같은 페이지에 결과(최대 24개)나 "No products match your search."를 보여 준다. 검색어가 없으면 빈 결과다.

### 화면 확인 링크

| 페이지·장면 | 화면 HTML | Layout |
| --- | --- | --- |
| Home · 검색 드로어 결과·결과 없음 | [기본](details/screens/home.html#default) · [검색 드로어 결과](details/screens/home.html#search-drawer) · [검색 드로어 결과 없음](details/screens/home.html#search-no-results) | [배치·장면](screen-layout.md#home) |
| Search · 결과·결과 없음 | [기본](details/screens/search.html#default) · [결과](details/screens/search.html#results) · [결과 없음](details/screens/search.html#no-results) | [배치·장면](screen-layout.md#search) |
| ProductDetail · 기본 | [기본](details/screens/product-detail.html#default) | [배치·장면](screen-layout.md#product-detail) |

<a id="n04"></a>
## N04. 상품 상세와 장바구니 담기

```navigation
ProductDetail --> (select_variant) : 옵션 선택
(select_variant) --> ProductDetail(VariantSelected) : 재고 있는 변형
(select_variant) --> ProductDetail(OutOfStock) : 품절 변형
ProductDetail(VariantSelected) --> (/store/line_items) : Add to cart(JS)
(/store/line_items) --> ProductDetail(CartDropdown) : 추가됨
ProductDetail(CartDropdown) --> Cart : Go to cart
ProductDetail(VariantSelected) --> (add_form_handler) : Add to cart(JS 없음)
(add_form_handler) --> Cart : 추가됨(303)
ProductDetail --> Collection : 컬렉션명
```

- 상품 페이지는 재고 있는 첫 변형을 미리 고른 채 열린다. 옵션 조합에 맞는 변형이 없으면 버튼이 "Select variant"로 비활성이고, 품절이면 "Out of stock"으로 비활성이다. 옵션 선택은 `v_id` 쿼리만 바꾼다.
- JavaScript로 담으면 같은 페이지에서 헤더 장바구니 드롭다운이 열린다. 실패하면 안내 없이 로딩이 멈춘다(분석서 I04).
- JavaScript 없이 담으면 `POST /{cc}/cart/add`가 `Cart`로 303 이동시킨다. 실패는 평문 응답이다(분석서 I06).

### 화면 확인 링크

| 페이지·장면 | 화면 HTML | Layout |
| --- | --- | --- |
| ProductDetail · 옵션 선택·품절·장바구니 드롭다운 | [기본](details/screens/product-detail.html#default) · [옵션 선택](details/screens/product-detail.html#variant-selected) · [품절](details/screens/product-detail.html#out-of-stock) · [장바구니 드롭다운](details/screens/product-detail.html#cart-dropdown) | [배치·장면](screen-layout.md#product-detail) |
| Cart · 기본 | [기본](details/screens/cart.html#default) | [배치·장면](screen-layout.md#cart) |
| Collection · 기본 | [기본](details/screens/collection.html#default) | [배치·장면](screen-layout.md#collection) |

<a id="n05"></a>
## N05. 장바구니 관리와 체크아웃 시작

```navigation
(load_cart) --> Cart : 품목 있음
(load_cart) --> Cart(Empty) : 품목 없음
(load_cart) --> NotFound(Cart) : 조회 오류
Cart(Empty) --> Store : Explore products
Cart --> AccountLogin : Sign in(비로그인)
Cart --> ProductDetail : 품목명
Cart --> (resolve_checkout_step) : Go to checkout
(resolve_checkout_step) --> Checkout(Address) : 주소·이메일 없음
(resolve_checkout_step) --> Checkout(Delivery) : 배송 방법 없음
(resolve_checkout_step) --> Checkout(Payment) : 그 외
```

- `/cart` 진입·새로고침 시 장바구니를 조회한다. 쿠키가 없으면 빈 장바구니, 조회가 실패하면 장바구니 전용 404 문구를 보여 준다.
- 수량 변경·삭제·프로모션 코드 적용은 같은 페이지에서 처리하고 이동하지 않는다. 오류는 품목 아래에 표시한다.
- Go to checkout은 장바구니 상태로 첫 미완료 단계를 골라 `Checkout?step=`로 보낸다. 로그인은 필요 없다.
- 비로그인이면 Sign in 안내가 보이고 `AccountLogin`으로 간다. 로그인 후 장바구니로 돌아오지 않는다(분석서 I02).
- 로그인 고객과 장바구니 고객이 다르면 모든 `(main)` 페이지 상단에 "Run transfer again" 배너가 뜬다. 이동은 없다.

### 화면 확인 링크

| 페이지·장면 | 화면 HTML | Layout |
| --- | --- | --- |
| Cart · 로그인 상태·빈 장바구니·로딩 | [기본](details/screens/cart.html#default) · [로그인 상태](details/screens/cart.html#signed-in) · [빈 장바구니](details/screens/cart.html#empty) · [로딩](details/screens/cart.html#loading) | [배치·장면](screen-layout.md#cart) |
| NotFound · 장바구니 조회 실패 | [기본](details/screens/not-found.html#default) · [장바구니 조회 실패](details/screens/not-found.html#cart) | [배치·장면](screen-layout.md#not-found) |
| Store · 기본 | [기본](details/screens/store.html#default) | [배치·장면](screen-layout.md#store) |
| AccountLogin · 로그인 | [기본](details/screens/account-login.html#default) | [배치·장면](screen-layout.md#account-login) |
| ProductDetail · 기본 | [기본](details/screens/product-detail.html#default) | [배치·장면](screen-layout.md#product-detail) |
| Checkout · 주소·배송·결제 단계 | [주소 입력](details/screens/checkout.html#address) · [배송 방법](details/screens/checkout.html#delivery) · [결제 수단](details/screens/checkout.html#payment) | [배치·장면](screen-layout.md#checkout) |
| Home · 장바구니 이전 실패 배너 | [기본](details/screens/home.html#default) · [장바구니 이전 실패 배너](details/screens/home.html#cart-mismatch) | [배치·장면](screen-layout.md#home) |

<a id="n06"></a>
## N06. 체크아웃 단계 진행

```navigation
(load_checkout_cart) --> Checkout(Address) : 장바구니 있음
(load_checkout_cart) --> NotFound(Checkout) : 장바구니 없음
Checkout(Address) --> (/store/cart_update) : Continue to delivery
(/store/cart_update) --> Checkout(AddressError) : 오류
(/store/cart_update) --> Checkout(Delivery) : 저장(배송 국가 경로)
Checkout(Delivery) --> (/store/shipping_method) : 배송 방법 선택
(/store/shipping_method) --> Checkout(Delivery) : 저장·오류 표시
Checkout(Delivery) --> Checkout(Payment) : Continue to payment
Checkout(Payment) --> (/store/payment_session) : Continue to review
(/store/payment_session) --> Checkout(PaymentCard) : Stripe 세션 새로 생성
(/store/payment_session) --> Checkout(Review) : 세션 준비
Checkout(PaymentCard) --> Checkout(Review) : 카드 입력 후 Continue to review
Checkout(Review) --> Checkout(Address) : Edit
Checkout --> Cart : Back to shopping cart
```

- `/checkout`은 장바구니 쿠키가 없으면 체크아웃 레이아웃의 404를 보여 준다. 단계는 `step` 쿼리로 바뀌고 같은 페이지다.
- 주소를 저장하면 `/{배송 국가}/checkout?step=delivery`로 서버 이동한다(분석서 I07). 저장 오류는 폼 아래 메시지다.
- 배송 방법은 고르는 즉시 저장되고, 저장된 방법이 있어야 결제 단계로 넘어간다.
- 결제 단계에서 Stripe 계열을 처음 고르면 세션을 만든 뒤 같은 단계에서 카드 입력란을 보여 준다. 그 밖에는 검토 단계로 간다. 세션 오류는 결제 단계에 표시된다.
- 완료된 단계의 Edit은 해당 단계로 돌아간다(그림은 주소를 대표로 그렸다).

### 화면 확인 링크

| 페이지·장면 | 화면 HTML | Layout |
| --- | --- | --- |
| Checkout · 주소 오류·배송·결제·카드 입력·검토 | [주소 입력](details/screens/checkout.html#address) · [주소 오류](details/screens/checkout.html#address-error) · [배송 방법](details/screens/checkout.html#delivery) · [결제 수단](details/screens/checkout.html#payment) · [Stripe 카드 입력](details/screens/checkout.html#payment-card) · [검토](details/screens/checkout.html#review) | [배치·장면](screen-layout.md#checkout) |
| NotFound · 체크아웃 그룹 404 | [기본](details/screens/not-found.html#default) · [체크아웃 그룹 404](details/screens/not-found.html#checkout) | [배치·장면](screen-layout.md#not-found) |
| Cart · 기본 | [기본](details/screens/cart.html#default) | [배치·장면](screen-layout.md#cart) |

<a id="n07"></a>
## N07. 주문하기(결제 수단별)

```navigation
Checkout(Review) --> (select_provider) : Place order
(select_provider) --> (/store/cart_complete) : 수동 결제
(select_provider) --> (stripe_confirm) : Stripe 계열
(select_provider) --> (/store/adyen_payment) : Adyen Drop-in 제출
(stripe_confirm) --> (/store/cart_complete) : 인라인 승인
(stripe_confirm) --> Checkout(ReviewError) : 결제 오류
(stripe_confirm) --> (payment_return) : 외부 인증 후 복귀
(/store/adyen_payment) --> OrderConfirmed : 주문 생성
(/store/adyen_payment) --> Checkout(ReviewError) : 거절·오류
(/store/adyen_payment) --> (payment_return) : 은행 인증 후 복귀
(/store/cart_complete) --> OrderConfirmed : 주문 생성
(/store/cart_complete) --> Checkout(ReviewError) : 완료 불가
OrderConfirmed --> Contact : Help의 Contact·Returns & Exchanges
```

- 주문이 생기면 장바구니 쿠키를 지우고 `/{배송 국가}/order/{id}/confirmed`로 이동한다. 기본 시드는 수동 결제만 있다(분석서 I09).
- 실패는 검토 단계의 오류 메시지로 남는다. 외부 인증 복귀는 [N08](#n08)에서 이어진다.
- 주문 완료 페이지는 직접 열어도 주문을 조회해 보여 주고, 조회 실패면 404다. 로딩 중에는 스켈레톤이 보인다.

### 화면 확인 링크

| 페이지·장면 | 화면 HTML | Layout |
| --- | --- | --- |
| Checkout · 검토·주문 오류 | [검토](details/screens/checkout.html#review) · [주문 오류](details/screens/checkout.html#review-error) | [배치·장면](screen-layout.md#checkout) |
| OrderConfirmed · 로딩 | [기본](details/screens/order-confirmed.html#default) · [로딩](details/screens/order-confirmed.html#loading) | [배치·장면](screen-layout.md#order-confirmed) |
| Contact · 기본 | [기본](details/screens/contact.html#default) | [배치·장면](screen-layout.md#contact) |

<a id="n08"></a>
## N08. 외부 결제 복귀

```navigation
(payment_return) --> (/store/adyen_payment) : Adyen redirectResult
(/store/adyen_payment) --> OrderConfirmed : 주문 생성
(/store/adyen_payment) --> Cart : 그 외(error=payment_failed)
(payment_return) --> Cart : 파라미터 없음(error=payment_failed)
(payment_return) --> (/store/cart_retrieve) : Stripe 파라미터
(/store/cart_retrieve) --> Cart : 세션 불일치(error=payment_failed)
(/store/cart_retrieve) --> Checkout(Payment) : redirect_status=failed
(/store/cart_retrieve) --> (/store/cart_complete) : 결제 확인
(/store/cart_complete) --> OrderConfirmed : 주문 생성
(/store/cart_complete) --> Cart : 실패(error=order_failed)
```

- 결제 제공자가 `/api/payment-return?cart_id=…&country_code=…`로 돌려보내면 Route Handler가 판단을 시작한다.
- 실패 복귀는 `Cart`에 `error` 쿼리를 붙이지만 장바구니 화면은 이를 표시하지 않아 기본 장면과 같다(분석서 I01).

### 화면 확인 링크

| 페이지·장면 | 화면 HTML | Layout |
| --- | --- | --- |
| OrderConfirmed · 기본 | [기본](details/screens/order-confirmed.html#default) | [배치·장면](screen-layout.md#order-confirmed) |
| Cart · 실패 복귀(기본과 같음) | [기본](details/screens/cart.html#default) | [배치·장면](screen-layout.md#cart) |
| Checkout · 결제 단계 | [결제 수단](details/screens/checkout.html#payment) | [배치·장면](screen-layout.md#checkout) |

<a id="n09"></a>
## N09. 로그인과 회원가입

```navigation
AccountLogin --> AccountLogin(Register) : Join us
AccountLogin(Register) --> AccountLogin : Sign in
AccountLogin --> (/auth/login) : Sign in
AccountLogin(Register) --> (/auth/register) : Join
(/auth/register) --> AccountLogin(RegisterError) : 오류
(/auth/register) --> (/auth/login) : 등록됨
(/auth/login) --> AccountLogin(SignInError) : 오류
(/auth/login) --> AccountLogin(VerificationSent) : 이메일 인증 필요
(/auth/login) --> AccountOverview : 성공(같은 URL 재렌더)
AccountLogin(Register) --> NotFound : Privacy Policy·Terms of Use 링크
```

- 비로그인으로 `/account/**`를 열면 로그인 화면이 보인다. 로그인·회원가입은 같은 경로의 컴포넌트 전환이다.
- 로그인에 성공하면 같은 URL이 대시보드로 다시 그려진다. 하위 경로(예: `/account/orders`)에서 로그인했다면 그 페이지가 보인다.
- 이메일 인증이 필요하면 같은 화면에 "We sent a verification link" 안내가 뜬다. 인증은 [N10](#n10)에서 이어진다.
- 회원가입 동의 문구의 링크는 없는 경로라 404로 간다(분석서 I03).

### 화면 확인 링크

| 페이지·장면 | 화면 HTML | Layout |
| --- | --- | --- |
| AccountLogin · 로그인 오류·인증 메일 발송·회원가입·회원가입 오류 | [기본](details/screens/account-login.html#default) · [로그인 오류](details/screens/account-login.html#sign-in-error) · [인증 메일 발송](details/screens/account-login.html#verification-sent) · [회원가입](details/screens/account-login.html#register) · [회원가입 오류](details/screens/account-login.html#register-error) | [배치·장면](screen-layout.md#account-login) |
| AccountOverview · 기본 | [기본](details/screens/account-overview.html#default) | [배치·장면](screen-layout.md#account-overview) |
| NotFound · 기본 | [기본](details/screens/not-found.html#default) | [배치·장면](screen-layout.md#not-found) |

<a id="n10"></a>
## N10. 이메일 인증

```navigation
(/auth/verify_confirm) --> VerifyAccount(Success) : 토큰 유효
(/auth/verify_confirm) --> VerifyAccount(Error) : 토큰 없음·만료
VerifyAccount(Success) --> AccountLogin : Go to sign in
VerifyAccount(Error) --> AccountLogin : Go to sign in
```

- 인증 메일 링크 `/{cc}/verify-account?token=`으로 들어오면 "Verifying your email..."을 보여 주며 확인 API를 호출한다. 직접 진입은 그림에 넣지 않았다.
- 두 결과 모두 로그인 화면으로 간다. 인증 후 첫 로그인에서 고객 레코드가 만들어진다.

### 화면 확인 링크

| 페이지·장면 | 화면 HTML | Layout |
| --- | --- | --- |
| VerifyAccount · 인증 성공·링크 무효 | [기본](details/screens/verify-account.html#default) · [인증 성공](details/screens/verify-account.html#success) · [링크 무효·만료](details/screens/verify-account.html#error) | [배치·장면](screen-layout.md#verify-account) |
| AccountLogin · 기본 | [기본](details/screens/account-login.html#default) | [배치·장면](screen-layout.md#account-login) |

<a id="n11"></a>
## N11. 계정 영역 이동과 로그아웃

```navigation
(check_customer) --> AccountLogin : 비로그인
(check_customer) --> AccountOverview : 로그인
AccountOverview --> AccountProfile : 메뉴 Profile
AccountOverview --> AccountAddresses : 메뉴 Addresses
AccountOverview --> AccountOrders : 메뉴 Orders
AccountOverview --> AccountOrderDetail : 최근 주문 선택
AccountOverview --> NotFound : Customer Service
AccountOverview --> (/auth/logout) : Log out
(/auth/logout) --> AccountLogin : redirect /account
```

- `/account/**` 직접 진입·새로고침은 계정 레이아웃의 고객 조회에서 시작한다. 비로그인이면 어느 하위 경로든 로그인 화면을 보여 준다.
- 계정 메뉴는 모든 계정 페이지에 같은 모양으로 있다(그림은 개요를 대표로 그렸다). 개요는 프로필 완성도·주소 수·최근 주문을 보여 주고, 주문이 없으면 "No recent orders"다.
- Customer Service 링크는 없는 경로라 404로 간다(분석서 I03).
- 로그아웃은 토큰·장바구니 쿠키를 지우고 `/{cc}/account`로 이동한다.

### 화면 확인 링크

| 페이지·장면 | 화면 HTML | Layout |
| --- | --- | --- |
| AccountLogin · 기본 | [기본](details/screens/account-login.html#default) | [배치·장면](screen-layout.md#account-login) |
| AccountOverview · 주문 없음·로딩 | [기본](details/screens/account-overview.html#default) · [주문 없음](details/screens/account-overview.html#no-orders) · [로딩](details/screens/account-overview.html#loading) | [배치·장면](screen-layout.md#account-overview) |
| AccountProfile · 기본 | [기본](details/screens/account-profile.html#default) | [배치·장면](screen-layout.md#account-profile) |
| AccountAddresses · 기본 | [기본](details/screens/account-addresses.html#default) | [배치·장면](screen-layout.md#account-addresses) |
| AccountOrders · 기본 | [기본](details/screens/account-orders.html#default) | [배치·장면](screen-layout.md#account-orders) |
| AccountOrderDetail · 기본 | [기본](details/screens/account-order-detail.html#default) | [배치·장면](screen-layout.md#account-order-detail) |
| NotFound · 기본 | [기본](details/screens/not-found.html#default) | [배치·장면](screen-layout.md#not-found) |

<a id="n12"></a>
## N12. 프로필 수정

화면 이동이 없는 과업이다. `AccountProfile`에서 이름·이메일·전화번호·청구지 주소 행마다 Edit을 눌러 펼치고 저장한다.

- 저장에 성공하면 행이 접히고 새 값이 보인다. 실패하면 펼친 행 아래에 오류 메시지가 보인다.
- 비밀번호 변경 행은 코드에서 주석 처리돼 화면에 없다(분석서 I11).

### 화면 확인 링크

| 페이지·장면 | 화면 HTML | Layout |
| --- | --- | --- |
| AccountProfile · 이름 편집·저장 오류 | [기본](details/screens/account-profile.html#default) · [이름 편집 열림](details/screens/account-profile.html#edit-name) · [저장 오류](details/screens/account-profile.html#edit-error) | [배치·장면](screen-layout.md#account-profile) |

<a id="n13"></a>
## N13. 배송지 관리

화면 이동이 없는 과업이다. `AccountAddresses`에서 New address 카드로 추가 모달을, 주소 카드의 Edit으로 편집 모달을 연다.

- 저장하면 모달이 닫히고 목록이 갱신된다. 실패하면 모달 안에 오류를 보여 준다. Cancel은 모달만 닫는다.
- Remove는 확인 없이 바로 삭제한다. 저장한 주소는 체크아웃 주소 선택에 쓰인다.

### 화면 확인 링크

| 페이지·장면 | 화면 HTML | Layout |
| --- | --- | --- |
| AccountAddresses · 새 주소·주소 편집 모달 | [기본](details/screens/account-addresses.html#default) · [새 주소 모달](details/screens/account-addresses.html#add-modal) · [주소 편집 모달](details/screens/account-addresses.html#edit-modal) | [배치·장면](screen-layout.md#account-addresses) |

<a id="n14"></a>
## N14. 주문 목록과 상세

```navigation
AccountOrders --> AccountOrderDetail : See details
AccountOrders(Empty) --> Home : Continue shopping
AccountOrderDetail --> AccountOrders : Back to overview
AccountOrderDetail --> Contact : Help의 Contact·Returns & Exchanges
(load_order) --> AccountOrderDetail : 내 주문
(load_order) --> NotFound : 조회 실패
```

- 주문 목록은 카드마다 날짜·번호·금액·품목 미리보기와 See details를 보여 준다. 주문이 없으면 Continue shopping 버튼이 보인다.
- 상세 주소 직접 진입은 주문 조회(`load_order`)에서 시작한다. 다른 고객의 주문이거나 없으면 404다.

### 화면 확인 링크

| 페이지·장면 | 화면 HTML | Layout |
| --- | --- | --- |
| AccountOrders · 주문 없음 | [기본](details/screens/account-orders.html#default) · [주문 없음](details/screens/account-orders.html#empty) | [배치·장면](screen-layout.md#account-orders) |
| AccountOrderDetail · 기본 | [기본](details/screens/account-order-detail.html#default) | [배치·장면](screen-layout.md#account-order-detail) |
| Home · 기본 | [기본](details/screens/home.html#default) | [배치·장면](screen-layout.md#home) |
| Contact · 기본 | [기본](details/screens/contact.html#default) | [배치·장면](screen-layout.md#contact) |
| NotFound · 기본 | [기본](details/screens/not-found.html#default) | [배치·장면](screen-layout.md#not-found) |

<a id="n15"></a>
## N15. 주문 소유권 이전 요청

화면 이동이 없는 과업이다. `AccountOrders` 하단 "Order transfers" 폼에 주문 ID를 넣고 요청한다.

- 접수되면 같은 폼 자리에 요청 완료 안내가 보인다. ID가 비었거나 백엔드가 거절하면 오류 문구가 보인다.
- 원주문자에게 메일이 가는지는 백엔드 알림 설정에 달려 있다(미확인).

### 화면 확인 링크

| 페이지·장면 | 화면 HTML | Layout |
| --- | --- | --- |
| AccountOrders · 이전 요청 완료·오류 | [기본](details/screens/account-orders.html#default) · [이전 요청 완료](details/screens/account-orders.html#transfer-sent) · [이전 요청 오류](details/screens/account-orders.html#transfer-error) | [배치·장면](screen-layout.md#account-orders) |

<a id="n16"></a>
## N16. 주문 소유권 이전 수락·거절

```navigation
OrderTransfer --> (/store/transfer_accept) : Accept transfer
OrderTransfer --> (/store/transfer_decline) : Decline transfer
(/store/transfer_accept) --> OrderTransfer(Accepted) : 수락됨
(/store/transfer_decline) --> OrderTransfer(Declined) : 거절됨
(/store/transfer_accept) --> OrderTransfer(Error) : 오류
(/store/transfer_decline) --> OrderTransfer(Error) : 오류
(transfer_accept_entry) --> OrderTransferAccept : 수락 경로 직접 진입
(transfer_decline_entry) --> OrderTransferDecline : 거절 경로 직접 진입
```

- 원주문자는 메일 링크 `/{cc}/order/{id}/transfer/{token}`으로 들어와 버튼으로 응답한다. 결과는 같은 페이지에 표시된다.
- `…/accept`, `…/decline`을 직접 열면 렌더링 중 바로 API를 호출하고 성공 또는 오류 문구만 보여 준다(분석서 I05). 두 페이지에는 공통 헤더·푸터 외 링크가 없다.

### 화면 확인 링크

| 페이지·장면 | 화면 HTML | Layout |
| --- | --- | --- |
| OrderTransfer · 수락·거절 완료·오류 | [기본](details/screens/order-transfer.html#default) · [수락 완료](details/screens/order-transfer.html#accepted) · [거절 완료](details/screens/order-transfer.html#declined) · [처리 오류](details/screens/order-transfer.html#error) | [배치·장면](screen-layout.md#order-transfer) |
| OrderTransferAccept · 오류 | [기본](details/screens/order-transfer-accept.html#default) · [오류](details/screens/order-transfer-accept.html#error) | [배치·장면](screen-layout.md#order-transfer-accept) |
| OrderTransferDecline · 오류 | [기본](details/screens/order-transfer-decline.html#default) · [오류](details/screens/order-transfer-decline.html#error) | [배치·장면](screen-layout.md#order-transfer-decline) |

<a id="n17"></a>
## N17. 정책·안내 페이지

```navigation
Home --> ShippingPolicy : 푸터 Shipping information
Home --> ReturnsPolicy : 푸터 Return policy
Home --> Terms : 푸터 Terms of service
Home --> Privacy : 푸터 Privacy policy
Home --> Contact : 푸터 Contact
```

- 푸터는 모든 `(main)` 페이지에 있어 Home은 출발 페이지를 대표한다.
- 배송·반품 페이지는 현재 국가 지역의 정책 메타데이터를 읽고, 없으면 "Policy details for this region haven't been published yet."를 보여 준다. 약관·개인정보·문의는 placeholder 안내가 포함된 정적 페이지다.

### 화면 확인 링크

| 페이지·장면 | 화면 HTML | Layout |
| --- | --- | --- |
| Home · 기본 | [기본](details/screens/home.html#default) | [배치·장면](screen-layout.md#home) |
| ShippingPolicy · 정책 없음 | [기본](details/screens/shipping-policy.html#default) · [정책 없음](details/screens/shipping-policy.html#unavailable) | [배치·장면](screen-layout.md#shipping-policy) |
| ReturnsPolicy · 정책 없음 | [기본](details/screens/returns-policy.html#default) · [정책 없음](details/screens/returns-policy.html#unavailable) | [배치·장면](screen-layout.md#returns-policy) |
| Terms · 기본 | [기본](details/screens/terms.html#default) | [배치·장면](screen-layout.md#terms) |
| Privacy · 기본 | [기본](details/screens/privacy.html#default) | [배치·장면](screen-layout.md#privacy) |
| Contact · 기본 | [기본](details/screens/contact.html#default) | [배치·장면](screen-layout.md#contact) |

<a id="n18"></a>
## N18. 퍼머링크와 에이전트 장바구니 이어받기

```navigation
(buy_permalink) --> (/store/line_items) : 품목·국가·변형 확인
(/store/line_items) --> Checkout(Address) : 장바구니 생성(303)
(cart_resume) --> (/store/cart_retrieve) : cartId
(/store/cart_retrieve) --> Checkout(Address) : 열린 장바구니(303)
```

- `/buy/{variant}:{qty},...?context/address_country=` 링크나 UCP의 `continue_url`(`/{cc}/cart/resume/{cartId}`)로 들어오면 장바구니를 쿠키에 넣고 체크아웃으로 보낸다. 장바구니 상태에 따라 실제로는 해당 단계가 열린다.
- 형식 오류·배송 불가 국가·없는 변형·구매 불가(400·404)와 완료·취소된 장바구니(410)는 화면이 아닌 평문 응답이다(분석서 I06).

### 화면 확인 링크

| 페이지·장면 | 화면 HTML | Layout |
| --- | --- | --- |
| Checkout · 주소 입력 | [주소 입력](details/screens/checkout.html#address) | [배치·장면](screen-layout.md#checkout) |

<a id="n19"></a>
## N19. 없는 페이지

```navigation
NotFound --> Home : Go to frontpage
NotFound(Checkout) --> Cart : Back to shopping cart
NotFound(Checkout) --> Home : Medusa Store
```

- 정의되지 않은 경로나 `notFound()`를 부른 페이지는 소속 그룹의 404를 보여 준다. `(main)`은 공통 헤더·푸터와 함께, 체크아웃 그룹은 체크아웃 헤더와 함께, 국가 세그먼트 밖은 셸 없이 보인다.

### 화면 확인 링크

| 페이지·장면 | 화면 HTML | Layout |
| --- | --- | --- |
| NotFound · 장바구니·체크아웃·루트 404 | [기본](details/screens/not-found.html#default) · [장바구니 조회 실패](details/screens/not-found.html#cart) · [체크아웃 그룹 404](details/screens/not-found.html#checkout) · [루트 404](details/screens/not-found.html#root) | [배치·장면](screen-layout.md#not-found) |
| Home · 기본 | [기본](details/screens/home.html#default) | [배치·장면](screen-layout.md#home) |
| Cart · 기본 | [기본](details/screens/cart.html#default) | [배치·장면](screen-layout.md#cart) |
