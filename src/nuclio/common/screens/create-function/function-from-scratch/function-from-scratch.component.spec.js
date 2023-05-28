/*
Copyright 2018 Iguazio Systems Ltd.
Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.
In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/
describe('nclFunctionFromScratch Component:', function () {
    var $componentController;
    var $rootScope;
    var $q;
    var $timeout;
    var ctrl;
    var runtimes;
    var $i18next;
    var lng;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$rootScope_, _$q_, _$timeout_, _$i18next_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
            $q = _$q_;
            $timeout = _$timeout_;
            $i18next = _$i18next_;
        });

        lng = i18next.language;

        runtimes = [
            {
                id: 'golang',
                name: 'Go',
                sourceCode: 'cGFja2FnZSBtYWluDQoNCmltcG9ydCAoDQogICAgImdpdGh1Yi5jb20vbnVjbGlvL251Y2xpby1zZGstZ28iDQo' +
                'pDQoNCmZ1bmMgSGFuZGxlcihjb250ZXh0ICpudWNsaW8uQ29udGV4dCwgZXZlbnQgbnVjbGlvLkV2ZW50KSAoaW50ZXJmYWNle3' +
                '0sIGVycm9yKSB7DQogICAgcmV0dXJuIG5pbCwgbmlsDQp9', // source code in base64
                visible: true
            },
            {
                id: 'python:3.6',
                name: 'Python 3.6',
                sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                visible: true
            },
            {
                id: 'python:3.7',
                name: 'Python 3.7',
                sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                visible: true
            },
            {
                id: 'python:3.8',
                name: 'Python 3.8',
                sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                visible: true
            },
            {
                id: 'python:3.9',
                name: 'Python 3.9',
                sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                visible: true
            },
            {
                id: 'dotnetcore',
                name: '.NET Core ' + $i18next.t('functions:TECH_PREVIEW_LABEL', { lng: lng }),
                sourceCode: 'dXNpbmcgU3lzdGVtOw0KdXNpbmcgTnVjbGlvLlNkazsNCg0KcHVibGljIGNsYXNzIG1haW4NCnsNCiAgICBwdWJ' +
                'saWMgb2JqZWN0IGhhbmRsZXIoQ29udGV4dCBjb250ZXh0LCBFdmVudCBldmVudEJhc2UpDQogICAgew0KICAgICAgICByZXR1cm' +
                '4gbmV3IFJlc3BvbnNlKCkNCiAgICAgICAgew0KICAgICAgICAgICAgU3RhdHVzQ29kZSA9IDIwMCwNCiAgICAgICAgICAgIENvb' +
                'nRlbnRUeXBlID0gImFwcGxpY2F0aW9uL3RleHQiLA0KICAgICAgICAgICAgQm9keSA9ICIiDQogICAgICAgIH07DQogICAgfQ0K' +
                'fQ==', // source code in base64
                visible: true
            },
            {
                id: 'java',
                name: 'Java ' + $i18next.t('functions:TECH_PREVIEW_LABEL', { lng: lng }),
                sourceCode: 'aW1wb3J0IGlvLm51Y2xpby5Db250ZXh0Ow0KaW1wb3J0IGlvLm51Y2xpby5FdmVudDsNCmltcG9ydCBpby5udWN' +
                'saW8uRXZlbnRIYW5kbGVyOw0KaW1wb3J0IGlvLm51Y2xpby5SZXNwb25zZTsNCg0KcHVibGljIGNsYXNzIEhhbmRsZXIgaW1wbG' +
                'VtZW50cyBFdmVudEhhbmRsZXIgew0KDQogICAgQE92ZXJyaWRlDQogICAgcHVibGljIFJlc3BvbnNlIGhhbmRsZUV2ZW50KENvb' +
                'nRleHQgY29udGV4dCwgRXZlbnQgZXZlbnQpIHsNCiAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKCkuc2V0Qm9keSgiIik7DQog' +
                'ICAgfQ0KfQ==',
                visible: true
            },
            {
                id: 'nodejs',
                sourceCode: 'ZXhwb3J0cy5oYW5kbGVyID0gZnVuY3Rpb24oY29udGV4dCwgZXZlbnQpIHsNCiAgICBjb250ZXh0LmNhbGxiYWN' +
                'rKCcnKTsNCn07', // source code in base64
                name: 'NodeJS ' + $i18next.t('functions:TECH_PREVIEW_LABEL', { lng: lng }),
                visible: true
            },
            {
                id: 'shell',
                name: 'Shell ' + $i18next.t('functions:TECH_PREVIEW_LABEL', { lng: lng }),
                sourceCode: 'ZWNobyAiSGVsbG8gZnJvbSBOdWNsaW8i',
                visible: true
            },
            {
                id: 'ruby',
                name: 'Ruby ' + $i18next.t('functions:TECH_PREVIEW_LABEL', { lng: lng }),
                sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpDQplbmQ=', // source code in base64
                visible: true
            }
        ];

        var bindings = {
            toggleSplashScreen: angular.noop,
            getProject: function () {
                return $q.when({
                    metadata: {
                        namespace: 'nuclio'
                    }
                });
            }
        };

        ctrl = $componentController('nclFunctionFromScratch', null, bindings);
        ctrl.$onInit();
        $rootScope.$digest();
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        $q = null;
        $timeout = null;
        ctrl = null;
        runtimes = null;
    });

    describe('$onInit():', function () {
        it('should fill ctrl.runtimes', function () {
            expect(ctrl.runtimes).toEqual(runtimes);
        });

        it('should initialize ctrl.functionData', function () {
           expect(ctrl.functionData.metadata.name).toEqual('');
           expect(ctrl.functionData.metadata.namespace).toEqual('');
        });
    });

    describe('inputValueCallback():', function () {
        it('should set new data for specified property', function () {
            ctrl.functionFromScratchForm = {};
            ctrl.inputValueCallback('new function name', 'name');

            $timeout.flush();

            expect(ctrl.functionData.metadata.name).toEqual('new function name');
        });
    });

    describe('onDropdownDataChange():', function () {
        it('should set new runtime to ctrl.functionData.spec.runtime', function () {
            var runtime = {
                id: 'python',
                name: 'Python',
                sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHBhc3M=', // source code in base64
                visible: true
            };

            ctrl.onRuntimeChange(runtime, true);

            expect(ctrl.functionData.spec.runtime).toEqual(runtime.id);
            expect(ctrl.functionData.spec.build.functionSourceCode).toEqual(runtime.sourceCode);
        });
    });
});
