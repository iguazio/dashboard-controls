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
describe('nclVersionTriggers component: ', function () {
    var $componentController;
    var $rootScope;
    var ConfigService;
    var lodash;
    var ctrl;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$rootScope_, _ConfigService_, _lodash_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
            ConfigService = _ConfigService_;
            lodash = _lodash_;
        });

        ConfigService.nuclio = {
            functionAuthenticationEnabled: false
        };

        var version = {
            spec: {
                triggers: {}
            },
            ui: {
                deployedVersion: {}
            }
        };

        var bindings = {
            containers: [],
            version: version,
            isFunctionDeploying: lodash.constant(false)
        };

        ctrl = $componentController('nclVersionTriggers', null, bindings);
        ctrl.$onInit();
        $rootScope.$digest();
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        ConfigService = null;
        lodash = null;
        ctrl = null;
    });

    describe('handleAction(\'update\', ...): ', function () {
        /**
         * Builds a minimal HTTP trigger edit-item and submits it via `ctrl.handleAction('update', ...)`.
         * @param {Object} [attributesOverrides] - overrides for the trigger's `attributes`.
         * @returns {Object} the resulting trigger object stored on `ctrl.version.spec.triggers`.
         */
        function submitHttpTrigger(attributesOverrides) {
            var selectedItem = {
                id: 'my-http-trigger',
                name: 'my-http-trigger',
                kind: 'http',
                maxWorkers: 1,
                attributes: lodash.assign({}, attributesOverrides)
            };

            ctrl.triggers.push(angular.copy(selectedItem));
            ctrl.handleAction('update', selectedItem);

            return ctrl.version.spec.triggers['my-http-trigger'];
        }

        it('should not send `authenticationMode`/`authentication` when functionAuthenticationEnabled is falsy',
            function () {
                ConfigService.nuclio.functionAuthenticationEnabled = false;

                var trigger = submitHttpTrigger({
                    authenticationMode: 'basicAuth',
                    authentication: {
                        basicAuth: {
                            username: 'my-user',
                            password: 'my-password'
                        }
                    }
                });

                expect(lodash.get(trigger, 'attributes.authenticationMode')).toBeUndefined();
                expect(lodash.get(trigger, 'attributes.authentication')).toBeUndefined();
            });

        it('should not send `authentication` when mode is `none`', function () {
            ConfigService.nuclio.functionAuthenticationEnabled = true;

            var trigger = submitHttpTrigger({
                authenticationMode: 'none',
                authentication: {
                    basicAuth: {}
                }
            });

            expect(trigger.attributes.authenticationMode).toBe('none');
            expect(lodash.get(trigger, 'attributes.authentication')).toBeUndefined();
        });

        it('should send `authenticationMode` but not `authentication` when mode is `api`', function () {
            ConfigService.nuclio.functionAuthenticationEnabled = true;

            var trigger = submitHttpTrigger({
                authenticationMode: 'api',
                authentication: {
                    basicAuth: {}
                }
            });

            expect(trigger.attributes.authenticationMode).toBe('api');
            expect(trigger.attributes.authentication).toBeUndefined();
        });

        it('should send both `authenticationMode` and `authentication` when mode is `basicAuth`', function () {
            ConfigService.nuclio.functionAuthenticationEnabled = true;

            var trigger = submitHttpTrigger({
                authenticationMode: 'basicAuth',
                authentication: {
                    basicAuth: {
                        username: 'my-user',
                        password: 'my-password'
                    }
                }
            });

            expect(trigger.attributes.authenticationMode).toBe('basicAuth');
            expect(trigger.attributes.authentication.basicAuth.username).toBe('my-user');
            expect(trigger.attributes.authentication.basicAuth.password).toBe('my-password');
        });
    });
});
