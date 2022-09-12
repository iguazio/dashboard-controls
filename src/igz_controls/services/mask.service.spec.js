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
describe('MaskService: ', function () {
    var MaskService;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_MaskService_) {
            MaskService = _MaskService_;
        });
    });

    afterEach(function () {
        MaskService = null;
    });

    describe('getMask(): ', function () {
        it('should return masked string', function () {
            var result = MaskService.getMask('pass1234');
            expect(result).toEqual('********');
        });
    });

    describe('getObjectWithMask(): ', function () {
        it('should return objects with masked values for given sensitive fields', function () {
            var result = MaskService.getObjectWithMask({
                    prop1: 'prop1Value',
                    prop2: {
                        sensitiveField: 'secretInfo'
                    }
                },
                ['sensitiveField']);

            expect(result).toEqual({
                prop1: 'prop1Value',
                prop2: {
                    sensitiveField: '**********'
                }
            });
        });

        it('should return object with masked value for the `password` field', function () {
            var result = MaskService.getObjectWithMask({
                    prop1: 'prop1Value',
                    password: 'pass1234'
                });

            expect(result).toEqual({
                prop1: 'prop1Value',
                password: '********'
            });
        });
    });
});
