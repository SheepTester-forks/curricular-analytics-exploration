"""
Utility functions for a partitioned list, which is what I will call a dictionary
that maps keys to lists of values with the same key.
"""

from typing import Any, Callable, Dict, Iterator, List, Protocol, Tuple, TypeVar


K = TypeVar("K")
V = TypeVar("V")


# Stolen from the typing for `sorted`
_T_contra = TypeVar("_T_contra", contravariant=True)


class SupportsDunderLT(Protocol[_T_contra]):
    def __lt__(self, __other: _T_contra) -> bool:
        ...


CompK = TypeVar("CompK", bound=SupportsDunderLT[Any])
CompK2 = TypeVar("CompK2", bound=SupportsDunderLT[Any])


def add_entries(target: Dict[K, List[V]], key: K, values: List[V]) -> None:
    """
    Insert a list of values with the same key into a partitioned list.
    """
    existing = target.get(key)
    if existing:
        existing += values
    else:
        target[key] = [*values]


def add_entry(target: Dict[K, List[V]], key: K, value: V) -> None:
    """
    Insert an entry into a partitioned list.
    """
    values = target.get(key)
    if values:
        values.append(value)
    else:
        target[key] = [value]


def partition(iterable: Iterator[Tuple[K, V]]) -> Dict[K, List[V]]:
    """
    Partitions a stream of values based on a key. The result maps keys to lists
    of values with the same key.

    The following example maps course code subjects to a list of course code
    numbers per subject.

    ```py
    subjects = partition((subject, number) for subject, number in course_codes)
    ```
    """
    result: Dict[K, List[V]] = {}
    for key, value in iterable:
        add_entry(result, key, value)
    return result


def merge_partition(
    target: Dict[K, List[V]], additional: Dict[K, List[V]]
) -> Dict[K, List[V]]:
    """
    Merges a partitioned list `additional` into an existing partitioned list
    `target`, mutating `target`.
    """
    for key, values in additional.items():
        add_entries(target, key, values)
    return target


def sorted_dict(
    dictionary: Dict[CompK, V], key: Callable[[CompK], CompK2] = lambda x: x
) -> List[Tuple[CompK, V]]:
    """
    Returns a list of key-value pairs in the given directionary sorted by the
    key.
    """
    return sorted(dictionary.items(), key=lambda entry: key(entry[0]))
