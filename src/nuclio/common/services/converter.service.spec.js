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
describe('ConverterService: ', function () {
    var ConverterService;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_ConverterService_) {
            ConverterService = _ConverterService_;
        });
    });

    afterEach(function () {
        ConverterService = null;
    });

    describe('getConvertedBytes(): ', function () {
        it('should return default object when no params passed', function () {
            var result = ConverterService.getConvertedBytes();
            expect(JSON.stringify(result)).toBe(JSON.stringify({value: 1025, label: 'GB/s', pow: 3}));
        });

        it('should return default object when 0 param passed', function () {
            var result = ConverterService.getConvertedBytes(0);
            expect(JSON.stringify(result)).toBe(JSON.stringify({value: 1025, label: 'GB/s', pow: 3}));
        });

        it('should return default object when incorrect param passed', function () {
            var result = ConverterService.getConvertedBytes('1024 bytes');
            expect(JSON.stringify(result)).toBe(JSON.stringify({value: 1025, label: 'GB/s', pow: 3}));
        });

        it('should return correct result object', function () {
            var result = ConverterService.getConvertedBytes(1024);
            expect(JSON.stringify(result)).toBe(JSON.stringify({value: 1, label: 'KB/s', pow: 1}));
        });

        it('should return maximum available value 1024 GB/s', function () {
            var result = ConverterService.getConvertedBytes(1125899906842624);
            expect(JSON.stringify(result)).toBe(JSON.stringify({value: 1024, label: 'GB/s', pow: 3}));
        });
    });

    describe('toNumberArray(): ', function () {
        it('should return array of numbers', function () {
            var result = ConverterService.toNumberArray('1, 2,3  , 5');
            expect(result).toEqual([1, 2, 3, 5]);
        });
    });

    describe('toStringArray(): ', function () {
        it('should return array of strings', function () {
            var result = ConverterService.toStringArray('foo, bar, , baz');
            expect(result).toEqual(['foo', 'bar', 'baz']);
        });
    });
});
