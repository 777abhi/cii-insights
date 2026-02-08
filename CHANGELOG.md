# [1.6.0](https://github.com/777abhi/cii-insights/compare/v1.5.2...v1.6.0) (2026-02-08)


### Features

* **client:** parallelize git tree diffing ([820ec8a](https://github.com/777abhi/cii-insights/commit/820ec8a9ebfec1e16310c7b8a7e33ddfda1e3dcc))

## [1.5.2](https://github.com/777abhi/cii-insights/compare/v1.5.1...v1.5.2) (2026-02-07)


### Performance Improvements

* **client:** optimize AnalysisService to remove artificial delay ([d5c8f15](https://github.com/777abhi/cii-insights/commit/d5c8f15c98010be2956c2fba801ad33824b11aef))

## [1.5.1](https://github.com/777abhi/cii-insights/compare/v1.5.0...v1.5.1) (2026-02-06)


### Performance Improvements

* parallelize git tree fetching in diff computation ([950f003](https://github.com/777abhi/cii-insights/commit/950f0038e95b0fd3c0718fab2191313fbb4e3ded))

# [1.5.0](https://github.com/777abhi/cii-insights/compare/v1.4.0...v1.5.0) (2026-02-05)


### Features

* coalesce concurrent git tree requests ([126c951](https://github.com/777abhi/cii-insights/commit/126c9514b68a385dbbf5fa0e7e51add5840d1b1f))

# [1.4.0](https://github.com/777abhi/cii-insights/compare/v1.3.3...v1.4.0) (2026-02-04)


### Features

* Cache sorted tree entries in GitService to optimize diff performance ([c169830](https://github.com/777abhi/cii-insights/commit/c16983071abb29d9d2001172e9a826395145b7d7))

## [1.3.3](https://github.com/777abhi/cii-insights/compare/v1.3.2...v1.3.3) (2026-02-03)


### Bug Fixes

* **electron:** resolve macos build errors ([7d2cd38](https://github.com/777abhi/cii-insights/commit/7d2cd38ea99739b90144d9cdc48ef46c57a5314b))

## [1.3.2](https://github.com/777abhi/cii-insights/compare/v1.3.1...v1.3.2) (2026-02-03)


### Performance Improvements

* optimize WorkPatternAnalyzer with O(1) heatmap access ([c2a8dd7](https://github.com/777abhi/cii-insights/commit/c2a8dd7561c2f0bb93b26c65cf38778939848425))

## [1.3.1](https://github.com/777abhi/cii-insights/compare/v1.3.0...v1.3.1) (2026-02-02)


### Performance Improvements

* Optimize GitLogParser regex compilation ([8fb5871](https://github.com/777abhi/cii-insights/commit/8fb58711716ce972fd56b8548457aa8057f3a45f))

# [1.3.0](https://github.com/777abhi/cii-insights/compare/v1.2.4...v1.3.0) (2026-02-01)


### Features

* allow custom number of days for git log analysis ([b84ff29](https://github.com/777abhi/cii-insights/commit/b84ff298417374024af5a7496a87309803645227))

## [1.2.4](https://github.com/777abhi/cii-insights/compare/v1.2.3...v1.2.4) (2026-02-01)


### Performance Improvements

* **client:** optimize ActivityLog filtering and rendering ([ae59a60](https://github.com/777abhi/cii-insights/commit/ae59a606346b8075e5be19a64eb09fd57c2dbfc9))

## [1.2.3](https://github.com/777abhi/cii-insights/compare/v1.2.2...v1.2.3) (2026-01-27)


### Bug Fixes

* **electron:** remove incompatible tar override to fix build ([9380cbd](https://github.com/777abhi/cii-insights/commit/9380cbd5dcb510a203791d3c8f4ff76160e799a2))

## [1.2.2](https://github.com/777abhi/cii-insights/compare/v1.2.1...v1.2.2) (2026-01-25)


### Bug Fixes

* **electron:** resolve 'app is damaged' error on macOS M1 ([10513ae](https://github.com/777abhi/cii-insights/commit/10513ae48184575e7ce664da0d4c13933f2d2880))

## [1.2.1](https://github.com/777abhi/cii-insights/compare/v1.2.0...v1.2.1) (2026-01-25)


### Bug Fixes

* **ci:** update electron artifact upload path to dist-build ([3e94075](https://github.com/777abhi/cii-insights/commit/3e9407539d69df69e231f292964b47100992bf4a))

# [1.2.0](https://github.com/777abhi/cii-insights/compare/v1.1.2...v1.2.0) (2026-01-25)


### Features

* refresh documentation images using mock repo ([4804e83](https://github.com/777abhi/cii-insights/commit/4804e834cd118c7969a088dacb57ef83ac0a1ca8))

## [1.1.2](https://github.com/777abhi/cii-insights/compare/v1.1.1...v1.1.2) (2026-01-25)


### Bug Fixes

* resolve prepare electron build error and add build steps ([c6d1a3d](https://github.com/777abhi/cii-insights/commit/c6d1a3d021aefe537fcd4cef796b5e430de2ff32))

## [1.1.1](https://github.com/777abhi/cii-insights/compare/v1.1.0...v1.1.1) (2026-01-25)


### Bug Fixes

* **client:** fix CodebaseHealth crash and optimize analysis for Android ([813a507](https://github.com/777abhi/cii-insights/commit/813a50728f180b775c8c5897a853eda859c84221))
* **client:** fix CodebaseHealth crash and optimize analysis for Android ([90e190b](https://github.com/777abhi/cii-insights/commit/90e190bd824415cb824de65d5dc3c50cefcfc8fc))

# [1.1.0](https://github.com/777abhi/cii-insights/compare/v1.0.0...v1.1.0) (2026-01-22)


### Features

* Add a 24-column grid template to the Tailwind CSS configuration. ([b934b7f](https://github.com/777abhi/cii-insights/commit/b934b7fd38363175a149b92f3996e366d60c34e5))
* add team insights, work patterns, and reorganize dashboard ([3358e6c](https://github.com/777abhi/cii-insights/commit/3358e6cad14747255e8f1913df928b496fa9a0c4))
* Enhance commit log with file-level statistics for recent commits and improve date parsing in analysis service. ([ae14002](https://github.com/777abhi/cii-insights/commit/ae14002756b54306999e3d1ddaf31492c169cabd))
* Implement a new `BranchSelector` component with dropdown suggestions and integrate it into the `Layout` component. ([30062af](https://github.com/777abhi/cii-insights/commit/30062af4f29b8262b722bc069651d50472e214a9))
* Implement a server-side CORS proxy for Git operations and configure the client to use it for non-native environments. ([5c47dc0](https://github.com/777abhi/cii-insights/commit/5c47dc0c13010758a854cdce4b6afdc9466331c1))
* Implement line-based diffing to accurately calculate commit additions and deletions. ([5fa93a9](https://github.com/777abhi/cii-insights/commit/5fa93a96d6e8043e748fc99991023519c1997416))

# 1.0.0 (2026-01-18)


### Bug Fixes

* **ci:** update Android build env to Node 22 and Java 21 ([61643c7](https://github.com/777abhi/cii-insights/commit/61643c77d30d353a240676456cc8d2b7eb83ae08))
* **ci:** update Node.js to v22 for Android and Electron builds ([37e264b](https://github.com/777abhi/cii-insights/commit/37e264b4e491f0beebe44742bf7aa16d6907851a))
* **electron:** add author email for linux deb build ([6564a4d](https://github.com/777abhi/cii-insights/commit/6564a4d72855589a033d09aeb2669b109815917e))
* enable android cleartext traffic and add network timeout ([89f9694](https://github.com/777abhi/cii-insights/commit/89f969405a4dd2927eae6c5ca63762d81c634d6a))
* file extension corrected ([7f9fbbd](https://github.com/777abhi/cii-insights/commit/7f9fbbd73fd57c1b6a29274413ef31aa25859585))


### Features

* 3 imp pr metrics ([4b50908](https://github.com/777abhi/cii-insights/commit/4b50908ca17472848664f64920eef2f9e723b776))
* Add cross-platform release pipeline and electron builder config ([b96aa44](https://github.com/777abhi/cii-insights/commit/b96aa44a217f732bbc49ede269264bfae19133d4))
* Add Docker, Electron, and PWA packaging support ([de0293a](https://github.com/777abhi/cii-insights/commit/de0293adf20cab0af8f8f0a6cc3279ad12d8b33c))
* Add sample repositories to the empty state, adjust LineChart dot visibility, and set `minTickGap` for X-axes. ([b3cc26a](https://github.com/777abhi/cii-insights/commit/b3cc26a4c90cf001ab673e213cad23a2517a9dbf))
* Add UI and API endpoints for managing local Git repositories, including listing and deletion. ([86d292e](https://github.com/777abhi/cii-insights/commit/86d292e884cea630f03a0868d68869a23292b69b))
* allow configurable API URL for Android and display errors ([913b5ad](https://github.com/777abhi/cii-insights/commit/913b5adc42925b2e30b77e70cad64263ccee3021))
* automated tests from jira z scale plug-in ([6fba05e](https://github.com/777abhi/cii-insights/commit/6fba05e96a9fb7fe0455a19372e561750b0184ad))
* **ci:** add semantic release pipeline and reusable workflows ([b300a03](https://github.com/777abhi/cii-insights/commit/b300a03a38b43ec004417dc67c76be23981334d6))
* code review metrics ([c9b4dea](https://github.com/777abhi/cii-insights/commit/c9b4dea6c2dd9b163fb74c8d230482a25fbc789a))
* codebase size analysis ([5a387e7](https://github.com/777abhi/cii-insights/commit/5a387e7a2432b581a76fdbf3c54a9ab857aeb95e))
* commit 3 imp metrics ([7dd0f0e](https://github.com/777abhi/cii-insights/commit/7dd0f0e8f0003ef43a9ee5d3c8743c6d4d5a34df))
* commit analysis ([aa26497](https://github.com/777abhi/cii-insights/commit/aa264973e8a3585693e7886f592288bb423a5825))
* contributors metrics ([f7c23d7](https://github.com/777abhi/cii-insights/commit/f7c23d7c36aaf79aabff20087db95cd725b67710))
* daily time saved ([6bb3e76](https://github.com/777abhi/cii-insights/commit/6bb3e7662b1de17bf0cce86f7a4a73e71e7345ff))
* Display top contributors and monthly author activity, supported by new backend metrics and development scripts. ([24b85c3](https://github.com/777abhi/cii-insights/commit/24b85c373fa246f653836b0cd6ecd1650ff6ad56))
* Initial release of QE Analytics Dashboard ([f605e89](https://github.com/777abhi/cii-insights/commit/f605e89adf005794ebeaaa9692af2d6cabaa8f20))
* Introduce React Router DOM for navigation, refactor existing dashboard into dedicated pages and a layout component, and add a new Top Authors page. ([9ad2451](https://github.com/777abhi/cii-insights/commit/9ad2451074449bfa1677fe96a491e113671c577b))
* playwright starter project ([e5de7d8](https://github.com/777abhi/cii-insights/commit/e5de7d89d5934a5b9cd79fdd92c77c5d232d353e))
* pr metrics ([3910e9f](https://github.com/777abhi/cii-insights/commit/3910e9fbaf9db38c582a8b8a5cb8fd35518e522c))
* print local IP address on server start ([38399b8](https://github.com/777abhi/cii-insights/commit/38399b80c6227c28ecb1912884eabca3a0bb7a2d))
* pull request metrics ([3e6cfa6](https://github.com/777abhi/cii-insights/commit/3e6cfa6eef2637843addc8c935523b52d9b19512))
* release analysis ([fca1c31](https://github.com/777abhi/cii-insights/commit/fca1c314506e7085ae4d978194e4dccad817e19e))
* unique commit count and workflow duration 90th percentile ([c190737](https://github.com/777abhi/cii-insights/commit/c1907371f2df120b35a1ca67c2fbf24947a57d96))
* unique commiter email ([b0522be](https://github.com/777abhi/cii-insights/commit/b0522be1e1644c5a83c8dc32e44f8deddd91b5c4))
* Update README with new feature sections, corresponding images, and streamlined setup instructions. ([ec647f2](https://github.com/777abhi/cii-insights/commit/ec647f2cc9be012c7dff67d27dfea615744eb83f))
* workflow run counts by date email pass fail ([f0089de](https://github.com/777abhi/cii-insights/commit/f0089de1a12c0fea299bc294f982e82f49b77850))
