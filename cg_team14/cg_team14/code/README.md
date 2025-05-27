# Computer Graphics (F017-1)

## Team 14

- 정진원 201720706
	- node create & delete
	- node select & transformation
	- modeling
	- demo video 촬영
- 이근호 202020767
	- modeling
	- texture
	- animation
	- ppt 제작
	- README 파일 작성


## 구현 목표

- hierarchical modeling 학습을 돕기 위한 시뮬레이터 제작한다.
- 직접 node를 추가 및 삭제하고 transformation을 적용해 봄으로써, hierarchical modeling의 기본 개념을 익힐 수 있도록 한다.


## 구현 설명

- node create & delete
	- 특정 node로부터 child node를 생성한다. 이때, node의 이름과 모양 등을 지정해야 한다.
	- 특정 node를 선택하여 삭제한다. 이때, 선택된 node의 모든 children node들도 같이 삭제된다.
- node select & transformation
	- node마다 이름표가 존재하는데, 해당 이름을 클릭함으로써 특정 node를 선택한다.
	- 우측 컨트롤러를 통해 선택된 node에 대한 translation, rotation, scale을 조정한다.
- modeling
	- 이전 과제들과 동일한 메커니즘을 가진다. buffer, attribute와 uniform 변수 등을 사용한다.
	- 원기둥, 구, 정육면체, 정사면체의 기본 모형을 함수를 통해 생성해두고, 호출에 따라 적절한 모형을 사용한다.
	- crank, person, hand에 대한 좌표는 수작업을 통해 적절한 transformation 값들을 계산하여 적용한다.
- texture
	- 크랭크축을 구현하는 데에 있어서, 파이프 부분에 철재 텍스처를 적용한다.
	- texture를 위한 buffer와 texture mapping 좌표 등을 사용한다.
	- 크랭크축 이외의 모델에서는 텍스처를 적용하지 않기 때문에, 모델을 구분하기 위한 uniform 변수와, 다른 모델의 경우, 임의의 texture mapping 좌표 (0,0)을 사용한다.
- animation
	- 위 modeling 결과에 대해 transformation을 frame마다 적용한다. 이때, transformation 값은 미리 계산된 값, 혹은 주어진 범위 내에서 반복 운동 등을 수행하도록 되어 있다.


## 코드 파일 설명

- glw3.js: 메인 js 파일
	- line 7: model 변경 가능
		- default: node 조작 학습 용도
		- crank: 크랭크축 애니메이션
		- person: 인체 모델 (w/o 애니메이션)
		- hand: 사람 손 모델 (버튼 클릭을 통한 손가락 움직임)
- ctrl.js: HTML event 관련 컨트롤 역할
- imgSrc.js: 철재 텍스처를 base64 형식으로 변환한 값
- renderObjectInfo.js: render 할 model에 대한 object 변수 선언
- shapes.js: 기본 모형 생성 역할
