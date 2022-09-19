# 동시성을 고려한 게임 Backend 서비스

| 👉 목차                            |                                        |
| ---------------------------------- | -------------------------------------- |
| [1. 요구사항 분석](#요구사항-분석) | 각 요구사항 분석                       |
| [2. API 명세서](#API-명세서)       | swagger url                            |
| [3. 구현 과정](#구현-과정)         | 기술스택, 모델링, 폴더 구조, 작업 내역 |
| [4. 테스트](#테스트)               | 각 서비스 unit test / e2e test         |
| [5. 서비스 배포](#서비스-배포)     | service url 및 배포 화면               |

보스레이드(Boss Raid) PVE 컨텐츠 관련 기능을 제공하는 백엔드 서비스입니다. `레이드(Raid)`란 비디오 게임에서 미션의 한 종류로 다수의 플레이어가 다수의 NPC(Non Player Character)를 상대로 공격하여 승리하는 것을 말합니다. 본 서비스에서 제공하는 기능으로는 `유저 생성`, `유저 조회`, `보스레이드 상태 조회`, `보스레이드 시작/종료`, `랭킹 조회`가 있습니다.  
- 한 번에 한 명의 유저만 보스레이드를 진행할 수 있다는 제약 조건을 만족시키기 위해 `동시성(Concurrency)`을 고려하여 서비스를 구현하였습니다(`Database Lock` 사용).  
- 또한 static 데이터 또는, 일정 시간동안 변하지 않는 데이터(ex. ranking)에 대한 요청을 효율적으로 처리하기 위해 이러한 요청에 대한 응답을 `레디스(Redis)에 캐싱` 하여 응답하도록 구현하였습니다.

# 요구사항 분석

## 1. 유저 관리

- 유저를 생성한다.

  - API: `POST /user`
  - 중복되지 않는 userId를 생성
  - 생성된 userId를 응답

- 유저를 조회한다.

  - API: `GET /user/:userId`
    - 해당 유저의 보스레이드 총 점수와 참여 기록 응답

## 2. 보스레이드 관리

- 보스레이드 상태 조회

  - API : `GET /bossRaid`
  - 보스레이드 현재 상태 응답
    - canEnter: 입장 가능 여부
    - enteredUserId: 현재 진행중인 유저가 있다면, 해당 유저의 id
  - 입장 가능 조건: 한 번에 한 명의 유저만 보스레이드를 진행할 수 있다.
    - 아무도 보스레이드를 시작한 기록이 없다면 시작 가능
    - 시작한 기록이 있다면  
      a. 마지막으로 시작한 유저가 보스레이드를 종료했거나  
      b. 마지막으로 시작한 시간으로부터 `레이드 제한 시간`만큼 경과되었어야 함

- 보스레이드 시작
  - API : `POST /bossRaid/enter`
  - 레이드 시작 가능하다면 중복되지 않는 raidRecordId를 생성하여 `isEntered: true`와 함께 응답
  - 레이드 시작이 불가능하다면 `isEntered: false`
- 보스레이드 종료
  - API : `PATCH /bossRaid/end`
  - raidRecordId 종료 처리
    - 레이드 level에 따른 score 반영
  - 유효성 검사
    - 저장된 userId와 raidRecordId 일치하지 않다면 예외 처리
    - 시작한 시간으로부터 `레이드 제한 시간`이 지났다면 예외 처리
- 보스레이드 랭킹 조회

  - API : `GET /bossRaid/topRankerList`
  - 보스레이드 `totalScore 내림차순`으로 랭킹을 조회한다.

- 추가 고려 사항
  - 랭킹 데이터는 레디스에 캐싱한다.
  - staticData도 캐싱을 고려한다.
  - 동시성을 고려한다.
  - 발생할 수 있는 다양한 에러 상황을 잘 처리한다.

# API 명세서

swagger를 사용하여 제작한 API Docs

[👉 Swagger Docs 바로가기]() //TODO: 주소 추가

# 구현 과정

## 기술 스택

- Framework: `NestJS`
- Database: `AWS RDS - mysql`
- ORM: `TypeORM`

## 환경 세팅

### 모델링

> 데이터베이스는 AWS RDS - mysql로 생성했습니다.

<img width="779" alt="스크린샷 2022-09-19 오후 10 16 07" src="https://user-images.githubusercontent.com/63445753/191026524-7e05a72a-3506-4648-8fe3-1be609404c25.png">


### 폴더 구조

```
concurrency-aware-game-backend-service/
├─ src/
│  ├─ app.service.ts
│  ├─ app.module.ts
│  ├─ main.ts
│  ├─ boss-raid-history/
│  ├─ user/
│  ├─ common/
│  ├─ database/
│  ├─ redis/
├─ test/
```

백엔드 서비스에 필요한 리소스들을 기준으로 폴더로 나누고, 각 폴더에 DTO 및 Entity를 작성하여 테이블 생성  
각 리소스 폴더에 module, controller, service, unit test가 정의되어 있음

- boss-raid-history: 보스레이드 리소스
- user: 유저 리소스
- common: enum, interface, type등 프로젝트에서 공통으로 사용되는 파일 저장
- database: 데이터베이스 리소스
- redis: 캐싱을 위한 Redis 리소스
- test: e2e 테스트

## 작업 내역

✔️ 서버 초기 세팅  
✔️ Redis 세팅  
✔️ User 기능 구현  
✔️ Boss Raid 기눙 구현  
✔️ Swagger API Documentation  
✔️ Readme.md 작성  
⭐️ Unit test 수행 // TODO  
⭐️ e2e test 수행 // TODO  
⭐️ 배포 // TODO  

# 테스트

## Unit Test

### 테스트 커버리지

// TODO: 테스트 커버리지 추가

<!--
#### Orders Service (주문)

- 주문 생성 기능 검증
- 주문 목록 조회 기능 검증
- 주문 조회 기증 검증
- 주문 상태 변경 기능 검증

#### Deliveries Service (배송)

- 주문 발송 처리(배송 정보 생성) 기능 검증
- 배송 상태 업데이트 (배송 중, 배송 완료) 기능 검증
- 배송 목록 조회 기능 검증

#### Coupons Service (쿠폰)

쿠폰 타입

- 쿠폰 타입 생성 기능 검증

쿠폰

- 쿠폰 코드 발급 기능 검증
- 사용 처리 기능 검증 (이미 사용되었을 경우 throws exception)
- 사용 처리 기능 검증 (쿠폰이 만료되었을 경우 throws exception)
- 사용 처리 기능 검증 (존재하지 않는 쿠폰 코드를 사용하는 경우 throws exception) -->

### 테스트 결과

// TODO: 테스트 결과 추가

<!-- #### Orders Service (주문)

<img width="838" alt="스크린샷 2022-09-14 오후 11 37 30" src="https://user-images.githubusercontent.com/63445753/190185588-5a630325-5ab0-42e9-b630-a93234dca155.png">

#### Deliveries Service (배송)

<img width="834" alt="스크린샷 2022-09-14 오후 11 37 56" src="https://user-images.githubusercontent.com/63445753/190185626-ff7c5226-c393-484c-8335-7e2d1af9465c.png">

#### Coupons Service (쿠폰)

<img width="744" alt="스크린샷 2022-09-14 오후 11 39 44" src="https://user-images.githubusercontent.com/63445753/190185685-f0d67a20-0840-4b7e-bb47-5f7e67cc5b2f.png">

<img width="909" alt="스크린샷 2022-09-14 오후 11 39 06" src="https://user-images.githubusercontent.com/63445753/190185706-d3a9c85c-51d9-497e-8ef0-23407bf87408.png"> -->

## e2e Test

### 테스트 커버리지

// TODO: 테스트 커버리지 추가

<!-- #### 주문 내역

- 주문 내역 열람 기능 검증
- 주문 내역 검색 기능 검증 (by 주문 상태)
- 주문 내역 검색 기능 검증 (by 시작일자, 종료일자)
- 주문 내역 검색 기능 검증 (by 주문자 명)
- 주문 내역 검색 기능 검증 (by 국가코드)

#### 쿠폰

- 쿠폰 타입 목록 조회 기능 검증 (쿠폰 타입별 사용 횟수, 쿠폰 타입별 총 할인액 정보를 포함해야 함)
- 쿠폰 사용에 따른 할인 적용 기능 검증 (배송비 할인) // == 구매 내역 추가 테스트
- 쿠폰 사용에 따른 할인 적용 기능 검증 (상품 가격 정액 할인) // == 구매 내역 추가 테스트
- 쿠폰 사용에 따른 할인 적용 기능 검증 (상품 가격 % 할인) // == 구매 내역 추가 테스트 -->

### 테스트 결과

// TODO: 테스트 결과 추가

<!-- #### 주문 내역

<img width="840" alt="스크린샷 2022-09-14 오후 11 43 41" src="https://user-images.githubusercontent.com/63445753/190187321-838dc96b-1403-4a49-ba2c-da66c4169ba7.png">

#### 쿠폰

<img width="829" alt="스크린샷 2022-09-14 오후 11 47 08" src="https://user-images.githubusercontent.com/63445753/190187435-855d7edc-cdd3-4d89-a65e-d62ed9b39384.png"> -->

# 서비스 배포

// TODO: 서비스 배포 주소 추가

// TODO: 서비스 배포 캡쳐 추가
