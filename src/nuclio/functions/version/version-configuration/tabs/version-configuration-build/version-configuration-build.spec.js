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

        var bindings = {
            onChangeCallback: angular.noop
        };

        ctrl = $componentController('nclVersionConfigurationBuild', {$scope: scope}, bindings);

        ctrl.file = {};
    });

    afterEach(function () {
        $componentController = null;
        $q = null;
        $rootScope = null;
        ctrl = null;
        ngDialog = null;
        Upload = null;
    });

    describe('onChanges(): ', function () {
       it('should set ctrl.buildCommands', function () {
           ctrl.version = {
               spec: {
                   build: {
                       commands: ['1', '2']
                   }
               }
           };

           var changes = {
               version: ctrl.version
           }
           ctrl.$onChanges(changes);

           expect(ctrl.build.commands).toEqual('1\n2');
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

            ctrl.inputValueCallback(commands, 'commands');

            expect(ctrl.version.spec.build.commands).toEqual(expectedCommands);
        });
    });

    describe('onFireAction(): ', function () {
        it('should set upload type to ctrl.uploadType', function () {
            var type = 'file';
            ctrl.uploadType = '';
            ctrl.file.uploaded = true;

            expect(ctrl.onFireAction(type)).toBeFalsy();
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
            ctrl.uploadType = 'script';
            ctrl.script = {
                uploading: false,
                uploaded: false,
                progress: '0%',
                icon: 'ncl-icon-script',
                name: ''
            };

            spyOn(Upload, 'upload').and.returnValue($q.when({}));

            ctrl.onFireAction('file');
            ctrl.uploadFile('file');

            expect(Upload.upload).toHaveBeenCalled();
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
