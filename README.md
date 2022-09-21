# 동시성을 고려한 게임 Backend 서비스

| 👉 목차                            |                                        |
| ---------------------------------- | -------------------------------------- |
| [1. 요구사항 분석](#요구사항-분석) | 각 요구사항 분석                       |
| [2. API 명세서](#API-명세서)       | swagger url                            |
| [3. 구현 과정](#구현-과정)         | 기술스택, 모델링, 폴더 구조, 작업 내역 |
| [4. 테스트](#테스트)               | 각 서비스 unit test / e2e test         |
| [5. 서비스 배포](#서비스-배포)     | service url 및 배포 화면               |

보스레이드(Boss Raid) PVE 컨텐츠 관련 기능을 제공하는 백엔드 서비스입니다. `레이드(Raid)`란 비디오 게임에서 미션의 한 종류로 다수의 플레이어가 다수의 NPC(Non Player Character)를 상대로 공격하여 승리하는 것을 말합니다. 본 서비스에서 제공하는 기능으로는 `유저 생성`, `유저 조회`, `보스레이드 상태 조회`, `보스레이드 시작/종료`, `랭킹 조회`가 있습니다.

- 한 번에 한 명의 유저만 보스레이드를 진행할 수 있다는 제약 조건을 만족시키기 위해 `동시성(Concurrency)`을 고려하여 서비스를 구현하였습니다([Distributed Locks with Redis](https://redis.io/docs/reference/patterns/distributed-locks/) 사용).
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

[👉 Swagger Docs 바로가기](https://app.swaggerhub.com/apis-docs/sys-ryan/concurreny-aware_boss_raid_pve_contents_backend_service/1#/BossRaid%20API/BossRaidHistoryController_getBossRaidStatus)   

# 구현 과정

## 기술 스택

- Framework: `NestJS`
- Database: `AWS RDS - mysql`
- ORM: `TypeORM`

## 환경 세팅

### 모델링

> 데이터베이스는 AWS RDS - mysql로 생성했습니다.

<img width="686" alt="스크린샷 2022-09-20 오후 9 12 23" src="https://user-images.githubusercontent.com/63445753/191254477-2d574932-966b-4349-bb12-d383e3f20358.png">


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
⭐️ Unit test 수행  
⭐️ e2e test 수행  
⭐️ 배포 

# 테스트

## Unit Test

### 테스트 커버리지

#### User Service

- 유저 생성 기능
- 유저 생성기 고유한 id 생성

### BossRaid Service

- 보스레이드 상태 조회

  - 보스레이드를 시작한 기록이 없다면 canEnter: true
  - 보스레이드를 플레이중인 유저가 있다면 canEnter: false
  - 시작한 시간으로부터 레이드 제한 시간 만큼 경과되었으면 canEnter: true

- 보스레이드 입장

  - 존재하지 않는 userId 로 요청시 예외 처리
  - 존재하지 않는 level 로 요청시 예외 처리
  - canEnter: false 일 때 입장 요청시 isEntered: false (입장 거부)

- 보스레이드 종료
  - 저장된 userId와 raidRecordId에 해당하는 user 불일치일 경우 예외처리
  - 존재하지 않는 raidRecordId일 경우 예외처리
  - 이미 종료된 레이드일 경우 예외 처리
  - 시작한 시간으로부터 레이드 제한시간이 지났다면 예외처리

### 테스트 결과

#### User Service 

<img width="612" alt="스크린샷 2022-09-20 오전 3 10 18" src="https://user-images.githubusercontent.com/63445753/191086872-20c622bf-706f-4055-b32b-4b8f1738d4dc.png">

#### BossRaid Service

<img width="876" alt="스크린샷 2022-09-20 오전 3 09 55" src="https://user-images.githubusercontent.com/63445753/191086911-f041a4da-95bc-4854-bc67-06ab05caeb4e.png">

## e2e Test

### 테스트 커버리지

#### 보스레이드

- 보스레이드 입장 성공시 서버 응답값 검증
- 보스레이드 입장 실패시 서버 응답값 검증
- 보스레이드 종료시 level에 따른 score 반영 검증

#### 랭킹

- 랭킹 정보 조회 서버 응답값 검증
 

### 테스트 결과

<img width="862" alt="스크린샷 2022-09-21 오후 3 39 17" src="https://user-images.githubusercontent.com/63445753/191447376-749ee7a4-3f8d-4cf8-8b41-b826f0b3d0d7.png">


# 서비스 배포

NestJS Server: `AWS EC2`  
Redis Cluster: `Docker`  
Database: `AWS RDS: Mysql`

### EC2 배포 화면 
<img width="1218" alt="스크린샷 2022-09-21 오후 4 39 47" src="https://user-images.githubusercontent.com/63445753/191445974-6871e18c-5810-4c25-97aa-3ada5b83ed55.png">


### 서버 SSH 접속 화면  
<img width="1548" alt="스크린샷 2022-09-20 오후 11 26 26" src="https://user-images.githubusercontent.com/63445753/191285483-d4d99874-cd22-4599-a719-4ec3dfaa1684.png">

### 보스레이드 상태조회 결과 화면
<img width="1678" alt="스크린샷 2022-09-20 오후 11 27 05" src="https://user-images.githubusercontent.com/63445753/191285577-fe9ec233-733f-456f-9c07-684d2f467b3a.png">
