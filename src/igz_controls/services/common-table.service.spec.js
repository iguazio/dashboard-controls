describe('CommonTableService: ', function () {
    var CommonTableService;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_CommonTableService_) {
            CommonTableService = _CommonTableService_;
        });
    });

    afterEach(function () {
        CommonTableService = null;
    });

    describe('getColumnSortingClasses(): ', function () {
        it('should return correct value if column is sorted ascending', function () {
            expect(CommonTableService.getColumnSortingClasses('some_test_column', 'some_test_column', false)).toEqual({
                'sorted': true,
                'reversed': false
            });
        });

        it('should return correct value if column is sorted descending ', function () {
            expect(CommonTableService.getColumnSortingClasses('some_test_column', 'some_test_column', true)).toEqual({
                'sorted': true,
                'reversed': true
            });
        });

        it('should return correct value if column is not sorted ', function () {
            expect(CommonTableService.getColumnSortingClasses('some_test_column', 'some_test_column_2', true)).toEqual({
                'sorted': false,
                'reversed': false
            });
            expect(CommonTableService.getColumnSortingClasses('some_test_column', 'some_test_column_2', false)).toEqual({
                'sorted': false,
                'reversed': false
            });
        });
    });
});
