describe('nclVersionConfigurationBuild component:', function () {
    var $componentController;
    var $q;
    var $rootScope;
    var ngDialog;
    var Upload;
    var ctrl;
    var scope;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$q_, _$rootScope_, _ngDialog_, _Upload_) {
            $componentController = _$componentController_;
            $q = _$q_;
            $rootScope = _$rootScope_;
            ngDialog = _ngDialog_;
            Upload = _Upload_;
        });

        scope = $rootScope.$new();

        ctrl = $componentController('nclVersionConfigurationBuild', {$scope: scope});
    });

    afterEach(function () {
        $componentController = null;
        $q = null;
        $rootScope = null;
        ctrl = null;
        ngDialog = null;
        Upload = null;
    });

    describe('onInit(): ', function () {
       it('should add in ctrl.version \'spec.build\' property', function () {
           var spec = {
               build: {}
           };
           ctrl.version = {};

           ctrl.$onInit();

           expect(ctrl.version.spec).toEqual(spec);
       });
    });

    describe('inputValueCallback(): ', function () {
        it('should set commands array from input to spec.build.commands property', function () {
            var commands = 'start\nrun\nfinish';
            var expectedCommands = ['start', 'run', 'finish'];

            ctrl.version = {
                spec: {
                    build: {}
                }
            };

            ctrl.inputValueCallback(commands);

            expect(ctrl.version.spec.build.commands).toEqual(expectedCommands);
        });
    });

    describe('onFireAction(): ', function () {
        it('should set upload type to ctrl.uploadType', function () {
            var type = 'file';
            ctrl.uploadType = '';

            ctrl.onFireAction(type);

            expect(ctrl.uploadType).toBe(type);
        });

        it('should call uploadFile()', function () {
            var data = {
                value: {
                    lastModified: 1521202971211,
                    name: 'filename.exe',
                    size: 220280032,
                    type: 'application/x-msdownload'
                }
            };

            spyOn(ngDialog, 'open').and.returnValue({
                closePromise: {
                    then: function (callback) {
                        callback(data);
                    }
                }
            });
            spyOn(ctrl, 'uploadFile');

            ctrl.onFireAction('file');

            expect(ngDialog.open).toHaveBeenCalled();
            expect(ctrl.uploadFile).toHaveBeenCalledWith(data.value);
        });
    });

    describe('uploadFile(): ', function () {
        it('should set values regarding file uploading', function () {
            var response = {
                config: {
                    data: {
                        file: {
                            lastModified: 1521202971211,
                            name: 'filename.exe',
                            size: 220280032,
                            type: 'application/x-msdownload'
                        }
                    }
                }
            };
            var expectedValue = {
                uploading: false,
                uploaded: true,
                progress: '100%',
                icon: 'ncl-icon-script',
                name: 'filename.exe'
            };

            ctrl.uploadType = 'script';
            ctrl.script = {
                uploading: false,
                uploaded: false,
                progress: '0%',
                icon: 'ncl-icon-script',
                name: ''
            };

            spyOn(Upload, 'upload').and.callFake(function () {
                return {
                    then: function (callback) {
                        return callback(response);
                    }
                };
            });

            ctrl.uploadFile();

            expect(ctrl.script).toEqual(expectedValue);
        });
    });

    describe('deleteFile(): ', function () {
        it('should revert file properties to default', function () {
            var type = 'script';
            var expectedResult = {
                uploading: false,
                uploaded: false,
                progress: '0%',
                icon: 'ncl-icon-' + type,
                name: ''
            };

            ctrl.script = {
                uploading: false,
                uploaded: true,
                progress: '54%',
                icon: 'ncl-icon-script',
                name: 'filename.exe'
            };

            ctrl.deleteFile(type);

            expect(ctrl.script).toEqual(expectedResult);
        });
    });
});
