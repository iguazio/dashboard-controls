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
describe('nclEditItem component: ', function () {
    var $componentController;
    var lodash;
    var ctrl;
    var item;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _lodash_) {
            $componentController = _$componentController_;
            lodash = _lodash_;
        });

        item = {
            kind: 'http',
            ui: {},
            attributes: {
                authenticationMode: 'basicAuth',
                authentication: {
                    basicAuth: {
                        username: 'my-user',
                        password: 'my-password'
                    }
                }
            }
        };

        var bindings = {
            item: item,
            classList: [],
            type: 'trigger',
            onSubmitCallback: angular.noop
        };

        ctrl = $componentController('nclEditItem', { $element: angular.element('<div></div>') }, bindings);
    });

    afterEach(function () {
        $componentController = null;
        lodash = null;
        ctrl = null;
        item = null;
    });

    describe('onSelectDropdownValue(): ', function () {
        it('should clear `attributes.authentication` when authenticationMode changes away from `basicAuth`', function () {
            ctrl.onSelectDropdownValue({ id: 'none' }, 'attributes.authenticationMode');

            expect(lodash.get(ctrl.item, 'attributes.authenticationMode')).toBe('none');
            expect(lodash.get(ctrl.item, 'attributes.authentication')).toBeUndefined();
        });

        it('should not clear `attributes.authentication` when authenticationMode stays `basicAuth`', function () {
            ctrl.onSelectDropdownValue({ id: 'basicAuth' }, 'attributes.authenticationMode');

            expect(lodash.get(ctrl.item, 'attributes.authenticationMode')).toBe('basicAuth');
            expect(lodash.get(ctrl.item, 'attributes.authentication.basicAuth.username')).toBe('my-user');
        });

        it('should not affect `attributes.authentication` for unrelated fields', function () {
            ctrl.onSelectDropdownValue({ id: 'some-value' }, 'attributes.someOtherField');

            expect(lodash.get(ctrl.item, 'attributes.authentication.basicAuth.username')).toBe('my-user');
        });
    });
});
