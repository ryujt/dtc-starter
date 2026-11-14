# Medusa DTC 스토어프론트 AS-IS Screen Layout

## 작성 기준

- 근거: `apps/storefront/src`의 페이지·컴포넌트 마크업과 Tailwind 클래스(기준 커밋 `44f2979`). 앱을 실행해 관찰하지 않았다.
- `layout`의 가로 배분 숫자는 Tailwind grid·고정 폭에서 읽은 **도해용 상대 가중치**다. 실제 픽셀 비율이 아니다. 반응형 기준점은 Medusa UI 프리셋의 `small`(1024px), `medium`(1280px)이다.
- 공통 셸은 한 번만 정의한다. `(main)` 셸은 헤더(Menu·MEDUSA STORE·검색·Account·Cart)와 푸터, 체크아웃 셸은 체크아웃 헤더와 Powered by 문구다. HTML은 `details/screens/assets/shell.js`로 셸을 그린다.
- HTML의 장면은 `파일.html#장면ID`로 직접 연다. 화면 오른쪽 아래 남색 상자는 검토용 장면 선택이며 제품 UI가 아니다. 예시 데이터는 시드(`initial-data-seed.ts`, `seed-demo-products.ts`)를 따른다.

### 공통 셸

```layout
Screen V Header, Banner, PageBody, Footer
Header > MenuButton : 33, StoreName : 34, HeaderActions : 33
HeaderActions > SearchIcon, AccountLink, CartLink
Footer V FooterTop, FooterBottom
FooterTop > FooterStoreName : 30, FooterColumns : 70
FooterColumns > Categories, Collections, CustomerService, MedusaLinks
FooterBottom > Copyright, PoweredBy
```

- Header는 높이 64px 고정(sticky). 1024px 미만에서는 AccountLink가 숨고 사이드 메뉴의 Account를 쓴다. CartLink는 `Cart (n)`이며 장바구니 변경 시 드롭다운을 연다.
- Banner는 로그인 고객과 장바구니 고객이 다를 때만 보이는 장바구니 이전 실패 배너다. 무료 배송까지 남은 금액 팝업(`FreeShippingPriceNudge`)도 장바구니가 있을 때 셸에 붙는다(HTML 미재현, 아래 미재현 목록).
- 사이드 메뉴(Home·Store·Account·Cart, 언어, Shipping to 국가)와 검색 드로어는 헤더에서 여는 오버레이다. 장면은 [home](#home)에 둔다.

```layout
Screen V CheckoutHeader, PageBody, MedusaCta
CheckoutHeader > BackToCart : 33, StoreName : 34, Spacer : 33
```

- 체크아웃 그룹(`(checkout)/layout.tsx`)의 셸이다. 공통 헤더·푸터가 없다.

## 전체 페이지·장면 목록

| 화면 ID | 페이지 이름·Navigation 표기 | 실제 경로·진입점·접근 조건 | 관련 시나리오 | Layout 절·HTML | 근거·확인 상태 |
| --- | --- | --- | --- | --- | --- |
| home | 홈 · `Home` | `/{cc}`, `/`(rewrite). 공개 | N01·N02·N03·N05·N14·N17·N19 | [home](#home) · [HTML](details/screens/home.html) | `(main)/page.tsx` · 코드 확인 |
| store | 전체 상품 · `Store` | `/{cc}/store`. 공개, 지역 없으면 404 | N02·N05 | [store](#store) · [HTML](details/screens/store.html) | `(main)/store/page.tsx`, `modules/store` · 코드 확인 |
| category | 카테고리 · `Category` | `/{cc}/categories/[...category]`. 없으면 404 | N02 | [category](#category) · [HTML](details/screens/category.html) | `categories/[...category]/page.tsx` · 코드 확인 |
| collection | 컬렉션 · `Collection` | `/{cc}/collections/[handle]`. 없으면 404 | N02·N04 | [collection](#collection) · [HTML](details/screens/collection.html) | `collections/[handle]/page.tsx` · 코드 확인 |
| search | 검색 결과 · `Search` | `/{cc}/search?q=`. 공개 | N03 | [search](#search) · [HTML](details/screens/search.html) | `(main)/search/page.tsx` · 코드 확인 |
| product-detail | 상품 상세 · `ProductDetail` | `/{cc}/products/[handle]`. 없으면 404 | N02~N05 | [product-detail](#product-detail) · [HTML](details/screens/product-detail.html) | `products/[handle]/page.tsx`, `modules/products` · 코드 확인 |
| cart | 장바구니 · `Cart` | `/{cc}/cart`. 조회 오류 시 장바구니 404 | N04~N08·N19 | [cart](#cart) · [HTML](details/screens/cart.html) | `(main)/cart/page.tsx`, `modules/cart` · 코드 확인 |
| checkout | 체크아웃 · `Checkout` | `/{cc}/checkout?step=address\|delivery\|payment\|review`. 장바구니 없으면 404 | N05~N08·N18 | [checkout](#checkout) · [HTML](details/screens/checkout.html) | `(checkout)/checkout/page.tsx`, `modules/checkout` · 코드 확인 |
| order-confirmed | 주문 완료 · `OrderConfirmed` | `/{cc}/order/[id]/confirmed`. 조회 실패 시 404 | N07·N08 | [order-confirmed](#order-confirmed) · [HTML](details/screens/order-confirmed.html) | `order/[id]/confirmed/page.tsx` · 코드 확인 |
| account-login | 로그인·회원가입 · `AccountLogin` | `/{cc}/account/**` 비로그인(`@login` 슬롯) | N05·N09~N11 | [account-login](#account-login) · [HTML](details/screens/account-login.html) | `account/layout.tsx`, `@login/*` · 코드 확인 |
| account-overview | 계정 개요 · `AccountOverview` | `/{cc}/account` 로그인 | N09·N11 | [account-overview](#account-overview) · [HTML](details/screens/account-overview.html) | `@dashboard/page.tsx` · 코드 확인 |
| account-profile | 프로필 · `AccountProfile` | `/{cc}/account/profile` 로그인 | N11·N12 | [account-profile](#account-profile) · [HTML](details/screens/account-profile.html) | `@dashboard/profile/page.tsx` · 코드 확인 |
| account-addresses | 배송지 · `AccountAddresses` | `/{cc}/account/addresses` 로그인 | N11·N13 | [account-addresses](#account-addresses) · [HTML](details/screens/account-addresses.html) | `@dashboard/addresses/page.tsx` · 코드 확인 |
| account-orders | 주문 목록 · `AccountOrders` | `/{cc}/account/orders` 로그인 | N11·N14·N15 | [account-orders](#account-orders) · [HTML](details/screens/account-orders.html) | `@dashboard/orders/page.tsx` · 코드 확인 |
| account-order-detail | 주문 상세 · `AccountOrderDetail` | `/{cc}/account/orders/details/[id]` 로그인, 없으면 404 | N11·N14 | [account-order-detail](#account-order-detail) · [HTML](details/screens/account-order-detail.html) | `@dashboard/orders/details/[id]/page.tsx` · 코드 확인 |
| verify-account | 이메일 인증 · `VerifyAccount` | `/{cc}/verify-account?token=`. 메일 링크 | N10 | [verify-account](#verify-account) · [HTML](details/screens/verify-account.html) | `verify-account/page.tsx` · 코드 확인 |
| order-transfer | 주문 이전 확인 · `OrderTransfer` | `/{cc}/order/[id]/transfer/[token]`. 메일 링크 | N16 | [order-transfer](#order-transfer) · [HTML](details/screens/order-transfer.html) | `transfer/[token]/page.tsx` · 코드 확인 |
| order-transfer-accept | 이전 수락 결과 · `OrderTransferAccept` | `…/transfer/[token]/accept`. 직접 진입 | N16 | [order-transfer-accept](#order-transfer-accept) · [HTML](details/screens/order-transfer-accept.html) | `accept/page.tsx` · 코드 확인 |
| order-transfer-decline | 이전 거절 결과 · `OrderTransferDecline` | `…/transfer/[token]/decline`. 직접 진입 | N16 | [order-transfer-decline](#order-transfer-decline) · [HTML](details/screens/order-transfer-decline.html) | `decline/page.tsx` · 코드 확인 |
| shipping-policy | 배송 정책 · `ShippingPolicy` | `/{cc}/shipping` | N17 | [shipping-policy](#shipping-policy) · [HTML](details/screens/shipping-policy.html) | `shipping/page.tsx` · 코드 확인 |
| returns-policy | 반품 정책 · `ReturnsPolicy` | `/{cc}/returns` | N17 | [returns-policy](#returns-policy) · [HTML](details/screens/returns-policy.html) | `returns/page.tsx` · 코드 확인 |
| terms | 이용약관 · `Terms` | `/{cc}/terms` | N17 | [terms](#terms) · [HTML](details/screens/terms.html) | `terms/page.tsx` · 코드 확인 |
| privacy | 개인정보 처리방침 · `Privacy` | `/{cc}/privacy` | N17 | [privacy](#privacy) · [HTML](details/screens/privacy.html) | `privacy/page.tsx` · 코드 확인 |
| contact | 문의 · `Contact` | `/{cc}/contact` | N07·N14·N17 | [contact](#contact) · [HTML](details/screens/contact.html) | `contact/page.tsx` · 코드 확인 |
| not-found | 없는 페이지 · `NotFound` | 미정의 경로, `notFound()` | N05·N06·N09·N11·N14·N19 | [not-found](#not-found) · [HTML](details/screens/not-found.html) | `not-found.tsx` 4곳 · 코드 확인 |

UI가 없는 경로(HTML 없음): `POST /{cc}/cart/add`, `GET /{cc}/cart/resume/[cartId]`, `GET /buy/[items]`, `GET /api/payment-return`(redirect·평문 응답), `/{cc}/products/[handle]/markdown`, `/ucp/**`, `/.well-known/ucp`, `/llms.txt`, `robots`, `sitemap`. 결과는 [navigation.md](navigation.md)와 [storefront.md](details/job-flow/storefront.md)에 기록했다.

<a id="home"></a>
## home — 홈

```layout
Screen V Header, Hero, CollectionRails, Footer
Hero V HeroHeading, HeroSubheading, GithubButton
CollectionRails V RailSummerEssentials, RailWinterLayers
RailSummerEssentials V RailTitleRow, RailProducts
RailTitleRow > RailTitle, ViewAllLink
RailProducts > ProductCard1, ProductCard2, ProductCard3
```

- Hero는 화면 높이 75% 회색 영역에 "Ecommerce Starter Template / Powered by Medusa and Next.js"와 GitHub 버튼을 둔다.
- 컬렉션마다 레일 하나: 제목, View all(→ Collection), 상품 카드(2열, 1024px 이상 3열). 카드는 썸네일·제목·최저가.
- 지역·컬렉션이 없으면 본문이 비고 헤더·푸터만 보인다.

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 기본 | N01~N03·N14·N17·N19 진입 | Hero·컬렉션 레일 | [default](details/screens/home.html#default) | `page.tsx`, `hero`, `product-rail` · 재현 |
| side-menu · 사이드 메뉴 | N01 Menu 클릭 | 왼쪽 반투명 패널: Home·Store·Account·Cart, 언어, Shipping to 국가 | [side-menu](details/screens/home.html#side-menu), 헤더 Menu | `side-menu` · 재현 |
| search-drawer · 검색 드로어 결과 | N03 검색 아이콘(JS) | 오른쪽 드로어: 입력·결과 목록 | [search-drawer](details/screens/home.html#search-drawer), 헤더 검색 아이콘 | `layout/components/search` · 재현 |
| search-no-results · 검색 드로어 결과 없음 | N03 결과 0건 | `No products found for "…"` | [search-no-results](details/screens/home.html#search-no-results) | 같은 컴포넌트 · 재현 |
| cart-mismatch · 장바구니 이전 실패 배너 | N05 고객·장바구니 불일치 | 주황 배너와 Run transfer again | [cart-mismatch](details/screens/home.html#cart-mismatch) | `cart-mismatch-banner` · 재현(본문은 자리표시) |
| empty · 지역·컬렉션 없음 | 지역·컬렉션 없음 | 빈 본문 | [empty](details/screens/home.html#empty) | `page.tsx` `return null` · 재현 |

<a id="store"></a>
## store — 전체 상품

```layout
Screen V Header, StoreTitle, StoreBody, Footer
StoreBody > Refinements : 25, Results : 75
Refinements V SortBy, OptionFacets, PriceRange, CategoryFacet, LabelFacet
Results V SearchBox, CurrentRefinements, ProductGrid, Pagination
```

- 1024px 미만에서는 Refinements가 Results 위로 쌓인다. 상품 12개씩, 그리드 2→3→4열.
- 모든 변경(검색어·정렬·패싯·가격·페이지)은 InstantSearch 상태와 URL 쿼리를 바꾸며 페이지를 떠나지 않는다.

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 전체 상품·필터 | N02 메뉴 Store | 정렬·패싯·가격·검색창·12개 상품·페이지 | [default](details/screens/store.html#default) | `modules/store` · 재현(데모 상품명은 예시) |
| filtered · 필터 적용 | N02 패싯·가격 선택 | 적용 필터 칩·Clear all·좁혀진 결과 | [filtered](details/screens/store.html#filtered), 패싯 클릭 | `current-refinements` · 재현 |
| no-results · 결과 없음 | N02 결과 0건 | 결과 없음 문구 | [no-results](details/screens/store.html#no-results) | `store-hits` · 재현 |
| page-2 · 2페이지 | N02 페이지 이동 | 다음 12개 | [page-2](details/screens/store.html#page-2), 페이지 번호 | `pagination` · 재현 |

<a id="category"></a>
## category — 카테고리

```layout
Screen V Header, CategoryBody, Footer
CategoryBody > SortSidebar : 20, CategoryMain : 80
CategoryMain V Breadcrumb, CategoryTitle, CategoryDescription, ChildCategories, ProductGrid, Pagination
```

- 상위 카테고리가 있으면 제목 앞에 상위 링크를 둔다. 하위 카테고리 목록은 링크다. 상품은 서버 조회, 정렬·옵션 필터·페이지는 쿼리.

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 상품 목록·하위 카테고리 | N02 푸터 카테고리 | 제목·하위 링크·상품 | [default](details/screens/category.html#default) | `categories/templates` · 재현(하위 이름은 예시, 시드에 하위 없음) |
| child · 하위 카테고리 | N02 하위 선택 | 상위 링크 + 하위 제목 | [child](details/screens/category.html#child) | 같은 템플릿 · 재현 |
| empty · 상품 없음 | 상품 0개 | 빈 그리드(별도 문구 없음) | [empty](details/screens/category.html#empty) | `paginated-products` · 재현 |

<a id="collection"></a>
## collection — 컬렉션

```layout
Screen V Header, CollectionBody, Footer
CollectionBody > SortSidebar : 20, CollectionMain : 80
CollectionMain V CollectionTitle, ProductGrid, Pagination
```

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 상품 목록 | N02 View all, N04 컬렉션명 | 제목·상품·페이지 | [default](details/screens/collection.html#default) | `collections/templates` · 재현 |
| empty · 상품 없음 | 상품 0개 | 빈 그리드 | [empty](details/screens/collection.html#empty) | 같은 템플릿 · 재현 |

<a id="search"></a>
## search — 검색 결과

```layout
Screen V Header, SearchBody, Footer
SearchBody V SearchTitle, SearchForm, ResultCount, ResultGrid
```

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 검색어 없음 | N03 푸터 Search, JS 없는 검색 아이콘 | "Search" 제목·폼 | [default](details/screens/search.html#default) | `search/page.tsx` · 재현 |
| results · 결과 | N03 검색어 제출 | 결과 수·상품(최대 24) | [results](details/screens/search.html#results), 폼 제출 | 같은 파일 · 재현 |
| no-results · 결과 없음 | 0건 | "No products match your search. Try a different keyword." | [no-results](details/screens/search.html#no-results) | 같은 파일 · 재현 |

<a id="product-detail"></a>
## product-detail — 상품 상세

```layout
Screen V Header, ProductMain, RelatedProducts, Footer
ProductMain > ProductInfo : 30, ImageGallery : 40, ProductActionsColumn : 30
ProductInfo V CollectionLink, ProductTitle, ProductDescription, ProductTabs
ProductActionsColumn V OptionSelectors, Price, AddToCartButton
```

- 1024px 미만에서는 세 열이 세로로 쌓이고, 버튼이 화면 밖으로 나가면 하단 고정 바(`MobileActions`)가 뜬다(HTML 미재현).
- Add to cart 폼은 JS가 있으면 Server Action, 없으면 `POST /{cc}/cart/add`로 제출된다.

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 옵션 미선택 | N04 맞는 변형 없음 | "From €10.00"·비활성 Select variant | [default](details/screens/product-detail.html#default) | `product-actions` · 재현 |
| variant-selected · 옵션 선택 | N04 옵션 선택(진입 시 기본) | 선택 옵션·가격·Add to cart | [variant-selected](details/screens/product-detail.html#variant-selected) | 같은 컴포넌트 · 재현 |
| out-of-stock · 품절 | N04 품절 변형 | 비활성 Out of stock | [out-of-stock](details/screens/product-detail.html#out-of-stock) | `isVariantInStock` · 재현(시드로는 품절 없음) |
| cart-dropdown · 장바구니 드롭다운 | N04 담기 성공(JS) | 헤더 아래 장바구니 미니 목록·Go to cart | [cart-dropdown](details/screens/product-detail.html#cart-dropdown), Add to cart | `cart-dropdown` · 재현 |

<a id="cart"></a>
## cart — 장바구니

```layout
Screen V Header, CartBody, Footer
CartBody > CartItemsColumn : 65, SummaryColumn : 35
CartItemsColumn V SignInPrompt, ItemsTable
SummaryColumn V SummaryHeading, DiscountCode, CartTotals, CheckoutButton
```

- 1024px 미만에서는 요약이 아래로 내려간다. 수량 선택·삭제·프로모션 코드는 같은 페이지에서 처리한다.

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 품목·로그인 안내 | N04 Go to cart, N05·N08 | Sign in 안내·품목 표·요약·Go to checkout | [default](details/screens/cart.html#default) | `modules/cart` · 재현 |
| signed-in · 로그인 상태 | N05 로그인 고객 | Sign in 안내 없음 | [signed-in](details/screens/cart.html#signed-in) | `templates/index.tsx` · 재현(헤더 표시는 셸 제약으로 동일) |
| empty · 빈 장바구니 | N05 품목 없음 | "Cart" 제목·안내·Explore products | [empty](details/screens/cart.html#empty) | `empty-cart-message` · 재현 |
| loading · 로딩 | 페이지 로딩 | 스켈레톤 | [loading](details/screens/cart.html#loading) | `cart/loading.tsx` · 재현 |

<a id="checkout"></a>
## checkout — 체크아웃

```layout
Screen V CheckoutHeader, CheckoutBody, MedusaCta
CheckoutBody > CheckoutForm : 60, CheckoutSummary : 40
CheckoutForm V AddressStep, DeliveryStep, PaymentStep, ReviewStep
CheckoutSummary V SummaryItems, DiscountCode, SummaryTotals
```

- 1024px 미만에서는 요약이 폼 아래로 간다. 열린 단계만 입력을 보여 주고, 끝난 단계는 요약과 Edit을, 아직 갈 수 없는 단계는 흐린 제목만 보여 준다.

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| address · 주소 입력 | N05·N06·N18 `step=address` | 배송지·이메일·청구지 동일 체크·Continue to delivery | [address](details/screens/checkout.html#address) | `addresses`, `shipping-address` · 재현 |
| address-error · 주소 오류 | N06 저장 실패 | 폼 아래 오류 | [address-error](details/screens/checkout.html#address-error) | `ErrorMessage` · 재현(문구 미확인) |
| delivery · 배송 방법 | N06 `step=delivery` | Standard·Express 라디오·Continue to payment | [delivery](details/screens/checkout.html#delivery) | `shipping` · 재현 |
| payment · 결제 수단 | N06·N08 `step=payment` | 결제 수단 라디오·Continue to review | [payment](details/screens/checkout.html#payment) | `payment` · 재현 |
| payment-card · Stripe 카드 입력 | N06 Stripe 세션 새로 생성 | 카드 입력 영역 | [payment-card](details/screens/checkout.html#payment-card) | `payment-container` · 근사 재현(iframe) |
| review · 검토 | N06·N07 `step=review` | 약관 안내·Place order | [review](details/screens/checkout.html#review) | `review`, `payment-button` · 재현 |
| review-error · 주문 오류 | N07 결제·완료 실패 | Place order 아래 오류 | [review-error](details/screens/checkout.html#review-error) | `payment-button` · 재현 |

<a id="order-confirmed"></a>
## order-confirmed — 주문 완료

```layout
Screen V Header, OrderConfirmedBody, Footer
OrderConfirmedBody V ThankYouHeading, OrderDetails, OrderItems, CartTotals, ShippingDetails, PaymentDetails, Help
```

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 주문 완료 | N07·N08 주문 생성 | 감사 문구·주문 번호·품목·합계·배송·결제·Help | [default](details/screens/order-confirmed.html#default) | `order-completed-template` · 재현 |
| loading · 로딩 | 페이지 로딩 | 스켈레톤 | [loading](details/screens/order-confirmed.html#loading) | `confirmed/loading.tsx` · 재현 |

<a id="account-login"></a>
## account-login — 로그인·회원가입

```layout
Screen V Header, AccountBody, Footer
AccountBody V AuthForm, AccountHelp
AuthForm V AuthTitle, AuthDescription, AuthNotice, AuthFields, AuthError, AuthSubmit, AuthSwitchLink
```

- 같은 경로에서 로그인과 회원가입 폼이 바뀐다. 회원가입은 이름·성·이메일·전화·비밀번호와 동의 문구가 추가된다. AccountHelp는 "Got questions?"와 Customer Service 링크(없는 경로).

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 로그인 | N05·N09~N11 비로그인 `/account` | 이메일·비밀번호·Sign in·Join us | [default](details/screens/account-login.html#default) | `components/login` · 재현 |
| sign-in-error · 로그인 오류 | N09 자격 불일치 | 폼 아래 오류 | [sign-in-error](details/screens/account-login.html#sign-in-error) | 같은 컴포넌트 · 재현(문구 예시) |
| verification-sent · 인증 메일 발송 | N09 인증 필요 | 인증 링크 발송 안내 | [verification-sent](details/screens/account-login.html#verification-sent) | login·register · 재현 |
| register · 회원가입 | N09 Join us | 가입 폼·동의 문구 | [register](details/screens/account-login.html#register) | `components/register` · 재현 |
| register-error · 회원가입 오류 | N09 가입 실패 | 폼 아래 오류 | [register-error](details/screens/account-login.html#register-error) | 같은 컴포넌트 · 재현(문구 예시) |

<a id="account-overview"></a>
## account-overview — 계정 개요

```layout
Screen V Header, AccountBody, Footer
AccountBody V AccountColumns, AccountHelp
AccountColumns > AccountNav : 20, OverviewContent : 80
OverviewContent V Greeting, ProfileStats, RecentOrders
ProfileStats > ProfileCompletion, SavedAddresses
```

- 1024px 미만에서는 개요 본문 대신 모바일 계정 메뉴(목록형)가 보인다(HTML은 데스크톱 기준). 계정 페이지 공통으로 AccountNav(Overview·Profile·Addresses·Orders·Log out)가 왼쪽에 있다.

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 개요·최근 주문 | N09 로그인 성공, N11 | 인사·완성도·주소 수·최근 주문 | [default](details/screens/account-overview.html#default) | `components/overview` · 재현 |
| no-orders · 주문 없음 | 주문 0건 | "No recent orders" | [no-orders](details/screens/account-overview.html#no-orders) | 같은 컴포넌트 · 재현 |
| loading · 로딩 | 페이지 로딩 | 스피너 | [loading](details/screens/account-overview.html#loading) | `loading.tsx` · 재현(셸 표시 범위 미확인) |

<a id="account-profile"></a>
## account-profile — 프로필

```layout
Screen V Header, AccountBody, Footer
AccountBody > AccountNav : 20, ProfileContent : 80
ProfileContent V ProfileHeading, NameRow, EmailRow, PhoneRow, BillingAddressRow
```

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 프로필 | N11 메뉴 Profile | 행별 현재 값·Edit | [default](details/screens/account-profile.html#default) | `profile-*`, `account-info` · 재현 |
| edit-name · 이름 편집 열림 | N12 Edit | 입력란·Save changes | [edit-name](details/screens/account-profile.html#edit-name) | `account-info` · 재현 |
| edit-error · 저장 오류 | N12 저장 실패 | 오류 문구 | [edit-error](details/screens/account-profile.html#edit-error) | 같은 컴포넌트 · 재현 |

<a id="account-addresses"></a>
## account-addresses — 배송지

```layout
Screen V Header, AccountBody, Footer
AccountBody > AccountNav : 20, AddressContent : 80
AddressContent V AddressHeading, AddressGrid
AddressGrid > NewAddressCard, AddressCard
```

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 주소 목록 | N11 메뉴 Addresses | New address·주소 카드(Edit·Remove) | [default](details/screens/account-addresses.html#default) | `address-book`, `address-card` · 재현 |
| add-modal · 새 주소 모달 | N13 New address | 주소 입력 모달 | [add-modal](details/screens/account-addresses.html#add-modal) | `add-address` · 재현 |
| edit-modal · 주소 편집 모달 | N13 Edit | 기존 값 채운 모달 | [edit-modal](details/screens/account-addresses.html#edit-modal) | `edit-address-modal` · 재현 |

<a id="account-orders"></a>
## account-orders — 주문 목록

```layout
Screen V Header, AccountBody, Footer
AccountBody > AccountNav : 20, OrdersContent : 80
OrdersContent V OrdersHeading, OrderCards, TransferRequestForm
```

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 주문 목록·이전 요청 폼 | N11·N14 | 주문 카드·See details·이전 요청 폼 | [default](details/screens/account-orders.html#default) | `order-overview`, `order-card`, `transfer-request-form` · 재현 |
| empty · 주문 없음 | N14 주문 0건 | "Nothing to see here"·Continue shopping | [empty](details/screens/account-orders.html#empty) | `order-overview` · 재현 |
| transfer-sent · 이전 요청 완료 | N15 접수 | 완료 안내 | [transfer-sent](details/screens/account-orders.html#transfer-sent) | `transfer-request-form` · 재현 |
| transfer-error · 이전 요청 오류 | N15 실패 | 오류 문구 | [transfer-error](details/screens/account-orders.html#transfer-error) | 같은 컴포넌트 · 재현(SDK 문구 미확인) |

<a id="account-order-detail"></a>
## account-order-detail — 주문 상세

```layout
Screen V Header, AccountBody, Footer
AccountBody > AccountNav : 20, OrderDetailContent : 80
OrderDetailContent V DetailHeader, OrderDetails, OrderItems, ShippingDetails, OrderSummary, Help
DetailHeader > DetailTitle, BackToOverview
```

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 주문 상세 | N11·N14 See details | 주문 정보·품목·배송·요약·Back to overview | [default](details/screens/account-order-detail.html#default) | `order-details-template` · 재현(상태 값 추정) |

<a id="verify-account"></a>
## verify-account — 이메일 인증

```layout
Screen V Header, VerifyBody, Footer
VerifyBody V VerifyTitle, VerifyMessage, GoToSignIn
```

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 확인 중 | N10 메일 링크 진입 | "Verifying your email..." | [default](details/screens/verify-account.html#default) | `verify-account` · 재현 |
| success · 인증 성공 | N10 토큰 유효 | 완료 안내·Go to sign in | [success](details/screens/verify-account.html#success) | 같은 컴포넌트 · 재현 |
| error · 링크 무효·만료 | N10 토큰 없음·만료 | 재로그인 안내·Go to sign in | [error](details/screens/verify-account.html#error) | 같은 컴포넌트 · 재현 |

<a id="order-transfer"></a>
## order-transfer — 주문 이전 확인

```layout
Screen V Header, TransferBody, Footer
TransferBody V TransferImage, TransferHeading, TransferDescription, TransferActions
TransferActions > AcceptButton, DeclineButton
```

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 수락·거절 버튼 | N16 메일 링크 진입 | 설명·Accept·Decline | [default](details/screens/order-transfer.html#default) | `transfer/[token]/page.tsx`, `transfer-actions` · 재현 |
| accepted · 수락 완료 | N16 수락 성공 | 완료 문구 | [accepted](details/screens/order-transfer.html#accepted) | `transfer-actions` · 재현 |
| declined · 거절 완료 | N16 거절 성공 | 완료 문구 | [declined](details/screens/order-transfer.html#declined) | 같은 컴포넌트 · 재현 |
| error · 처리 오류 | N16 실패 | 오류 문구 | [error](details/screens/order-transfer.html#error) | 같은 컴포넌트 · 재현(문구 미확인) |

<a id="order-transfer-accept"></a>
## order-transfer-accept — 이전 수락 결과

```layout
Screen V Header, TransferResultBody, Footer
TransferResultBody V TransferImage, ResultHeading, ResultMessage
```

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 이전 완료 | N16 accept 직접 진입 성공 | "Order transfered!" | [default](details/screens/order-transfer-accept.html#default) | `accept/page.tsx` · 재현(원문 오타 유지) |
| error · 오류 | N16 실패 | 오류 문구·Error message | [error](details/screens/order-transfer-accept.html#error) | 같은 파일 · 재현 |

<a id="order-transfer-decline"></a>
## order-transfer-decline — 이전 거절 결과

```layout
Screen V Header, TransferResultBody, Footer
TransferResultBody V TransferImage, ResultHeading, ResultMessage
```

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 거절 완료 | N16 decline 직접 진입 성공 | "Order transfer declined!" | [default](details/screens/order-transfer-decline.html#default) | `decline/page.tsx` · 재현 |
| error · 오류 | N16 실패 | 오류 문구 | [error](details/screens/order-transfer-decline.html#error) | 같은 파일 · 재현 |

<a id="shipping-policy"></a>
## shipping-policy — 배송 정책

```layout
Screen V Header, PolicyBody, Footer
PolicyBody V PolicyTitle, PolicyIntro, ShippingSummary, PolicyNote
```

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 배송 정책 | N17 푸터 | 국가·요금·처리/배송 일수 | [default](details/screens/shipping-policy.html#default) | `shipping/page.tsx`, `policies/templates` · 재현 |
| unavailable · 정책 없음 | 지역 정책 없음 | 미게시 안내 | [unavailable](details/screens/shipping-policy.html#unavailable) | `PoliciesUnavailable` · 재현 |

<a id="returns-policy"></a>
## returns-policy — 반품 정책

```layout
Screen V Header, PolicyBody, Footer
PolicyBody V PolicyTitle, ReturnWindow, ReturnShippingCost
```

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 반품 정책 | N17 푸터 | 30일·반품 배송비 고객 부담 | [default](details/screens/returns-policy.html#default) | `returns/page.tsx` · 재현 |
| unavailable · 정책 없음 | 지역 정책 없음 | 미게시 안내 | [unavailable](details/screens/returns-policy.html#unavailable) | `PoliciesUnavailable` · 재현 |

<a id="terms"></a>
## terms — 이용약관

```layout
Screen V Header, PolicyBody, Footer
PolicyBody V PolicyTitle, PlaceholderNotice, PolicyParagraphs
```

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 약관 | N17 푸터 | placeholder 안내·약관 문단 | [default](details/screens/terms.html#default) | `terms/page.tsx` · 재현 |

<a id="privacy"></a>
## privacy — 개인정보 처리방침

```layout
Screen V Header, PolicyBody, Footer
PolicyBody V PolicyTitle, PlaceholderNotice, PolicyParagraphs
```

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 개인정보 처리방침 | N17 푸터 | placeholder 안내·문단 | [default](details/screens/privacy.html#default) | `privacy/page.tsx` · 재현 |

<a id="contact"></a>
## contact — 문의

```layout
Screen V Header, PolicyBody, Footer
PolicyBody V PolicyTitle, PlaceholderNotice, ContactParagraph
```

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · 문의 안내 | N07·N14 Help, N17 푸터 | placeholder 안내·문의 문단(연락처 없음) | [default](details/screens/contact.html#default) | `contact/page.tsx` · 재현 |

<a id="not-found"></a>
## not-found — 없는 페이지

```layout
Screen V Header, NotFoundBody, Footer
NotFoundBody V NotFoundTitle, NotFoundMessage, FrontpageLink
```

- 셸은 그룹마다 다르다: `(main)`·장바구니는 공통 셸, 체크아웃은 체크아웃 헤더, 국가 세그먼트 밖은 셸 없음.

| 장면 ID·이름 | 관련 시나리오·진입 동작/조건 | 보이는 내용·다음 동작/결과 | HTML의 장면 링크·전환 방법 | 근거·확인/재현 상태 |
| --- | --- | --- | --- | --- |
| default · (main) 그룹 404 | N09·N11·N14·N19 | "Page not found"·Go to frontpage | [default](details/screens/not-found.html#default) | `(main)/not-found.tsx` · 재현 |
| cart · 장바구니 조회 실패 404 | N05 장바구니 조회 오류 | 쿠키 삭제 안내 | [cart](details/screens/not-found.html#cart) | `cart/not-found.tsx` · 재현 |
| checkout · 체크아웃 그룹 404 | N06 장바구니 없음 | 체크아웃 헤더·404 문구 | [checkout](details/screens/not-found.html#checkout) | `(checkout)/not-found.tsx` · 재현 |
| root · 루트 404 | 국가 밖 경로 | 셸 없는 404 | [root](details/screens/not-found.html#root) | `app/not-found.tsx` · 재현 |

## 미재현 장면·요소

| 대상 | 이유 |
| --- | --- |
| 무료 배송 넛지 팝업(`FreeShippingPriceNudge`) | 셸 전체에 붙는 팝업이며 배송 옵션 계산에 의존. 이동과 무관해 장면으로 두지 않았다 |
| 상품 상세 모바일 하단 고정 바(`MobileActions`), 온보딩 CTA | 화면 폭·온보딩 쿠키 조건. HTML 주석으로만 기록 |
| 체크아웃의 저장 주소 선택, 매장 픽업 옵션, 프로모션 입력 열림 | 로그인·픽업 설정 조건. 체크아웃 HTML 주석으로 기록 |
| 계정 개요의 1024px 미만 모바일 메뉴 | HTML은 데스크톱 기준. 설명만 기록 |
| 오류 문구 전반(로그인·주소·이전 등) | 백엔드 오류 메시지를 그대로 보여 주는 구조라 실제 문구 미확인. 예시 문구 사용 |
