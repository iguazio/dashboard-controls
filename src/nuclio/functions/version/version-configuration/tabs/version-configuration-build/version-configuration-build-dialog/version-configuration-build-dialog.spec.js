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
describe('nclVersionConfigurationBuildDialog component:', function () {
    var $componentController;
    var $q;
    var $rootScope;
    var ctrl;
    var scope;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$q_, _$rootScope_) {
            $componentController = _$componentController_;
            $q = _$q_;
            $rootScope = _$rootScope_;
        });

        scope = $rootScope.$new();
        var bindings = {
            closeDialog: angular.noop
        };

        ctrl = $componentController('nclVersionConfigurationBuildDialog', {$scope: scope}, bindings);
    });

    afterEach(function () {
        $componentController = null;
        $q = null;
        $rootScope = null;
        ctrl = null;
    });

    describe('onClose(): ', function () {
        it('should close dialog calling closeDialog() method', function () {
            spyOn(ctrl, 'closeDialog');

            ctrl.onClose();

            expect(ctrl.closeDialog).toHaveBeenCalled();
        });
    });

    describe('uploadFile(): ', function () {
        it('should close dialog calling closeDialog() method and pass file object in this method', function () {
            var file = {
                lastModified: 1521202971211,
                name: 'filename.exe',
                size: 220280032,
                type: 'application/x-msdownload'
            };

            spyOn(ctrl, 'closeDialog');

            ctrl.uploadFile(file);

            expect(ctrl.closeDialog).toHaveBeenCalledWith({file: file});
        });
    });
});
