from app.models.challenge import ComparisonMode
from app.services.result_compare import compare_results


def test_unordered_comparison():
    assert compare_results([[2, "B"], [1, "A"]], [[1, "A"], [2, "B"]], ComparisonMode.unordered)


def test_ordered_comparison():
    assert compare_results([[1], [2]], [[1], [2]], ComparisonMode.ordered)
    assert not compare_results([[2], [1]], [[1], [2]], ComparisonMode.ordered)


def test_single_value_comparison():
    assert compare_results([[10]], [[10.0]], ComparisonMode.single_value)
