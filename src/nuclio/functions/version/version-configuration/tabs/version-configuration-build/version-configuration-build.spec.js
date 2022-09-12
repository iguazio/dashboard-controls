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
               },
               ui: {
                   imageNamePrefix: 'somePrefix'
               }
           };

           var changes = {
               version: ctrl.version
           };
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
