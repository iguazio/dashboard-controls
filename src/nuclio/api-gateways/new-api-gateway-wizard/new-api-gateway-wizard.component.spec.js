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
describe('nclNewApiGatewayWizard component: ', function () {
    var $componentController;
    var $q;
    var $rootScope;
    var ConfigService;
    var lodash;
    var ctrl;
    var project;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$q_, _$rootScope_, _ConfigService_, _lodash_) {
            $componentController = _$componentController_;
            $q = _$q_;
            $rootScope = _$rootScope_;
            ConfigService = _ConfigService_;
            lodash = _lodash_;
        });

        ConfigService.nuclio = {
            allowedAuthenticationModes: ['none', 'basicAuth', 'accessKey', 'oauth2'],
            functionAuthenticationEnabled: false
        };

        project = {
            metadata: {
                name: 'my-project',
                namespace: 'nuclio'
            }
        };
    });

    afterEach(function () {
        $componentController = null;
        $q = null;
        $rootScope = null;
        ConfigService = null;
        lodash = null;
        ctrl = null;
        project = null;
    });

    /**
     * Creates the component controller and runs `$onInit()`.
     * @param {Object} [apiGatewaySpecOverrides] - overrides for `apiGateway.spec`.
     * @returns {Object} the initialized controller.
     */
    function createController(apiGatewaySpecOverrides) {
        var apiGateway = {
            spec: lodash.assign({ upstreams: [] }, apiGatewaySpecOverrides),
            ui: {}
        };

        var bindings = {
            apiGateway: apiGateway,
            apiGateways: [],
            closeDialog: angular.noop,
            createApiGateway: $q.when.bind($q),
            editWizard: false,
            getFunctions: $q.when.bind($q),
            ngDialogId: 'dialog-1',
            project: project,
            updateApiGateway: $q.when.bind($q)
        };

        ctrl = $componentController('nclNewApiGatewayWizard', null, bindings);
        ctrl.$onInit();
        $rootScope.$digest();

        return ctrl;
    }

    describe('initApiGateway() (via $onInit()): ', function () {
        it('should default `authenticationMode` to \'none\' when functionAuthenticationEnabled is falsy', function () {
            ConfigService.nuclio.functionAuthenticationEnabled = false;

            createController();

            expect(ctrl.apiGateway.spec.authenticationMode).toBe('none');
        });

        it('should not default `authenticationMode` when functionAuthenticationEnabled is truthy', function () {
            ConfigService.nuclio.functionAuthenticationEnabled = true;

            createController();

            expect(ctrl.apiGateway.spec.authenticationMode).toBeUndefined();
        });
    });

    describe('saveApiGateway(): ', function () {
        /**
         * Triggers `ctrl.saveApiGateway()` and returns the API gateway object that was submitted.
         * @returns {Object} the submitted API gateway.
         */
        function triggerSaveAndGetSubmittedApiGateway() {
            var event = { preventDefault: angular.noop };

            ctrl.apiGatewayForm = {
                $valid: true,
                $setSubmitted: angular.noop
            };

            spyOn(ctrl, 'isChangesHaveBeenMade').and.returnValue(true);
            spyOn(ctrl, 'createApiGateway').and.returnValue($q.when());

            ctrl.saveApiGateway(event);
            $rootScope.$digest();

            return ctrl.createApiGateway.calls.mostRecent().args[0].apiGateway;
        }

        it('should strip pre-existing `authenticationMode`/`authentication` when functionAuthenticationEnabled ' +
            'is truthy', function () {
            ConfigService.nuclio.functionAuthenticationEnabled = true;

            createController({
                name: 'my-gateway',
                authenticationMode: 'basicAuth',
                authentication: {
                    basicAuth: {
                        username: 'my-user',
                        password: 'my-password'
                    }
                }
            });

            var submittedApiGateway = triggerSaveAndGetSubmittedApiGateway();

            expect(submittedApiGateway.spec.authenticationMode).toBeUndefined();
            expect(submittedApiGateway.spec.authentication).toBeUndefined();
        });

        it('should keep `authenticationMode`/`authentication` when functionAuthenticationEnabled is falsy', function () {
            ConfigService.nuclio.functionAuthenticationEnabled = false;

            createController({
                name: 'my-gateway',
                authenticationMode: 'basicAuth',
                authentication: {
                    basicAuth: {
                        username: 'my-user',
                        password: 'my-password'
                    }
                }
            });

            var submittedApiGateway = triggerSaveAndGetSubmittedApiGateway();

            expect(submittedApiGateway.spec.authenticationMode).toBe('basicAuth');
            expect(submittedApiGateway.spec.authentication.basicAuth.username).toBe('my-user');
        });
    });
});
