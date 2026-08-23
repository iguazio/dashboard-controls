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
describe('FunctionsService: ', function () {
    var FunctionsService;
    var ConfigService;
    var lodash;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_FunctionsService_, _ConfigService_, _lodash_) {
            FunctionsService = _FunctionsService_;
            ConfigService = _ConfigService_;
            lodash = _lodash_;
        });

        ConfigService.nuclio = {
            allowedAuthenticationModes: ['none', 'api', 'browser', 'basicAuth'],
            functionAuthenticationEnabled: false
        };
    });

    afterEach(function () {
        FunctionsService = null;
        ConfigService = null;
        lodash = null;
    });

    describe('getClassesList(\'trigger\'): ', function () {
        it('should return the `http` class as the first element of the trigger list', function () {
            var classesList = FunctionsService.getClassesList('trigger');

            expect(classesList[0].id).toBe('http');
        });

        it('should hide `authenticationMode` field when `functionAuthenticationEnabled` is falsy', function () {
            ConfigService.nuclio.functionAuthenticationEnabled = false;

            var httpClass = lodash.find(FunctionsService.getClassesList('trigger'), ['id', 'http']);
            var authenticationModeField = lodash.find(httpClass.fields, ['name', 'authenticationMode']);

            expect(authenticationModeField.visible).toBeFalsy();
        });

        it('should show `authenticationMode` field when `functionAuthenticationEnabled` is truthy', function () {
            ConfigService.nuclio.functionAuthenticationEnabled = true;

            var httpClass = lodash.find(FunctionsService.getClassesList('trigger'), ['id', 'http']);
            var authenticationModeField = lodash.find(httpClass.fields, ['name', 'authenticationMode']);

            expect(authenticationModeField.visible).toBeTruthy();
        });

        it('should hide username/password fields when `functionAuthenticationEnabled` is falsy, ' +
            'even if authenticationMode is `basicAuth`', function () {
            ConfigService.nuclio.functionAuthenticationEnabled = false;

            var httpClass = lodash.find(FunctionsService.getClassesList('trigger'), ['id', 'http']);
            var usernameField = lodash.find(httpClass.fields, ['name', 'authenticationUsername']);
            var passwordField = lodash.find(httpClass.fields, ['name', 'authenticationPassword']);
            var item = { attributes: { authenticationMode: 'basicAuth' } };

            expect(usernameField.visible(item)).toBeFalsy();
            expect(passwordField.visible(item)).toBeFalsy();
        });

        it('should hide username/password fields when `functionAuthenticationEnabled` is truthy but ' +
            'authenticationMode is not `basicAuth`', function () {
            ConfigService.nuclio.functionAuthenticationEnabled = true;

            var httpClass = lodash.find(FunctionsService.getClassesList('trigger'), ['id', 'http']);
            var usernameField = lodash.find(httpClass.fields, ['name', 'authenticationUsername']);
            var passwordField = lodash.find(httpClass.fields, ['name', 'authenticationPassword']);
            var item = { attributes: { authenticationMode: 'none' } };

            expect(usernameField.visible(item)).toBeFalsy();
            expect(passwordField.visible(item)).toBeFalsy();
        });

        it('should show username/password fields when `functionAuthenticationEnabled` is truthy and ' +
            'authenticationMode is `basicAuth`', function () {
            ConfigService.nuclio.functionAuthenticationEnabled = true;

            var httpClass = lodash.find(FunctionsService.getClassesList('trigger'), ['id', 'http']);
            var usernameField = lodash.find(httpClass.fields, ['name', 'authenticationUsername']);
            var passwordField = lodash.find(httpClass.fields, ['name', 'authenticationPassword']);
            var item = { attributes: { authenticationMode: 'basicAuth' } };

            expect(usernameField.visible(item)).toBeTruthy();
            expect(passwordField.visible(item)).toBeTruthy();
        });

        it('should filter `authenticationMode` values by `allowedAuthenticationModes`', function () {
            ConfigService.nuclio.allowedAuthenticationModes = ['none', 'basicAuth'];

            var httpClass = lodash.find(FunctionsService.getClassesList('trigger'), ['id', 'http']);
            var authenticationModeField = lodash.find(httpClass.fields, ['name', 'authenticationMode']);
            var modeIds = lodash.map(authenticationModeField.values, 'id');

            expect(modeIds).toEqual(['none', 'basicAuth']);
        });
    });
});
