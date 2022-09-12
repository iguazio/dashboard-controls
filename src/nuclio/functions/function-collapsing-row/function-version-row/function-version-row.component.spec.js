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
describe('nclFunctionVersionRow component:', function () {
    var $componentController;
    var $state;
    var ctrl;
    var NuclioHeaderService;
    var VersionHelperService;
    var functionItem;
    var project;
    var version;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$state_, _NuclioHeaderService_, _VersionHelperService_) {
            $componentController = _$componentController_;
            $state = _$state_;
            NuclioHeaderService = _NuclioHeaderService_;
            VersionHelperService = _VersionHelperService_;
        });

        functionItem = {
            'metadata': {
                'name': 'functionName',
                'namespace': 'nuclio'
            },
            'spec': {
                'description': 'Some description',
                'runtime': 'golang',
                'replicas': 1,
                'build': {},
                'runRegistry': 'localhost:5000'
            }
        };
        project = {
            'metadata': {
                'name': 'my-project-1',
                'namespace': 'nuclio'
            },
            'spec': {
                'description': 'Some description'
            }
        };
        version = {
            name: 'Version 1',
            invocation: '30',
            last_modified: '2018-02-05T17:07:48.509Z'
        };

        var bindings = {
            version: version,
            project: project,
            function: functionItem,
            versionsList: [version],
            actionHandlerCallback: angular.noop,
            toggleFunctionState: angular.noop
        };

        ctrl = $componentController('nclFunctionVersionRow', null, bindings);

        ctrl.$onInit();
    });

    afterEach(function () {
        $componentController = null;
        $state = null;
        ctrl = null;
        NuclioHeaderService = null;
        VersionHelperService = null;
        functionItem = null;
        project = null;
        version = null;
    });

    describe('$onInit(): ', function () {
        it('should set initial values for actions and ui fields', function () {
            expect(ctrl.version.ui.checked).toBeFalsy();
            expect(ctrl.version.ui.edit).not.toBeUndefined();
            expect(ctrl.version.ui.delete).not.toBeUndefined();

            expect(ctrl.actions).not.toBe([]);
        });
    });

    describe('onFireAction(): ', function () {
        it('should call actionHandlerCallback() method', function () {
            spyOn(ctrl, 'actionHandlerCallback');

            ctrl.onFireAction('delete');

            expect(ctrl.actionHandlerCallback).toHaveBeenCalled();
            expect(ctrl.actionHandlerCallback).toHaveBeenCalledWith({actionType: 'delete', checkedItems: [ctrl.version]});
        });
    });

    describe('onSelectRow(): ', function () {
        it('should call $state.go() method and update header title', function () {
            var event = new MouseEvent('click');
            Object.defineProperty(event, 'target', {writable: false, value: {closest: angular.noop}});

            spyOn($state, 'go');

            ctrl.onSelectRow(event);

            expect($state.go).toHaveBeenCalled();
        });
    });

    describe('onToggleFunctionState(): ', function () {
        it('should call ctrl.toggleFunctionState() method', function () {
            spyOn(ctrl, 'toggleFunctionState');

            ctrl.onToggleFunctionState();

            expect(ctrl.toggleFunctionState).toHaveBeenCalled();
        });
    });
});
