RE: tony W, what caused the infinite loop? 

step 1:  `git diff --name-only (git describe --tag --abbrev=0) packages/guided-learning`
packages/guided-learning/src/redux/reducers/guided-learning.reducer.js
packages/guided-learning/src/redux/sagas/guided-learning.saga.js
packages/guided-learning/src/redux/sagas/guided-learning.saga.test.js
packages/guided-learning/src/redux/selectors/guided-learning.selector.js
packages/guided-learning/src/redux/selectors/guided-learning.selector.test.js
packages/guided-learning/src/utils/scriptInjector.js
packages/guided-learning/src/utils/scriptInjector.test.js
packages/guided-learning/src/withGuidedLearning.jsx
packages/guided-learning/src/withGuidedLearning.test.jsx
 /o/g/wdp-ui-common   master ±  yarn conventional-recommended-bump -l @wdpui/common-guided-learning  --commmit-path packages/detect-web-view  -p angular
yarn run v1.7.0


step 2: `/opt/git/wdp-ui-common/node_modules/.bin/conventional-recommended-bump -l @wdpui/common-guided-learning --commmit-path packages/detect-web-view -p angular`

patch
Done in 0.82s.