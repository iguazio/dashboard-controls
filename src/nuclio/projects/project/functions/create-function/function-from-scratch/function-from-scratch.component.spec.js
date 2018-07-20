describe('nclFunctionFromScratch Component:', function () {
    var $componentController;
    var $rootScope;
    var $q;
    var $timeout;
    var ctrl;
    var runtimes;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$rootScope_, _$q_, _$timeout_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
            $q = _$q_;
            $timeout = _$timeout_;
        });

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
                id: 'python:2.7',
                name: 'Python 2.7',
                sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                visible: true
            },
            {
                id: 'python:3.6',
                name: 'Python 3.6',
                sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                visible: true
            },
            {
                id: 'pypy',
                name: 'PyPy',
                sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                visible: true
            },
            {
                id: 'dotnetcore',
                name: '.NET Core',
                sourceCode: 'dXNpbmcgU3lzdGVtOw0KdXNpbmcgTnVjbGlvLlNkazsNCg0KcHVibGljIGNsYXNzIG1haW4NCnsNCiAgICBwdWJ' +
                'saWMgb2JqZWN0IGhhbmRsZXIoQ29udGV4dCBjb250ZXh0LCBFdmVudCBldmVudEJhc2UpDQogICAgew0KICAgICAgICByZXR1cm' +
                '4gbmV3IFJlc3BvbnNlKCkNCiAgICAgICAgew0KICAgICAgICAgICAgU3RhdHVzQ29kZSA9IDIwMCwNCiAgICAgICAgICAgIENvb' +
                'nRlbnRUeXBlID0gImFwcGxpY2F0aW9uL3RleHQiLA0KICAgICAgICAgICAgQm9keSA9ICIiDQogICAgICAgIH07DQogICAgfQ0K' +
                'fQ==', // source code in base64
                visible: true
            },
            {
                id: 'java',
                name: 'Java',
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
                name: 'NodeJS',
                visible: true
            },
            {
                id: 'shell',
                name: 'Shell',
                sourceCode: '',
                visible: true
            },
            {
                id: 'ruby',
                name: 'Ruby',
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

            ctrl.onDropdownDataChange(runtime, true);

            expect(ctrl.functionData.spec.runtime).toEqual(runtime.id);
            expect(ctrl.functionData.spec.build.functionSourceCode).toEqual(runtime.sourceCode);
        });
    });
});