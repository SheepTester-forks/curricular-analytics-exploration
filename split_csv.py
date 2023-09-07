"""
Split the prereq and plan files into smaller, header-less files so they're
faster to parse.

python3 prereqs files/prereqs_fa23.csv
python3 plans files/academic_plans_fa23.csv
"""

from abc import abstractmethod
import csv
import os
from shutil import rmtree
from typing import (
    Dict,
    Generic,
    Hashable,
    List,
    NamedTuple,
    Optional,
    Tuple,
    TypeVar,
)

from util import CsvWriter

T = TypeVar("T", bound=Hashable)


class Grouper(Generic[T]):
    @abstractmethod
    def group(self, row: List[str]) -> T:
        pass

    @abstractmethod
    def file_name(self, group: T) -> str:
        pass


class PrereqGrouper(Grouper[str]):
    def group(self, row: List[str]) -> str:
        return row[0]

    def file_name(self, group: str) -> str:
        return f"prereqs_{group}.csv"


class PlanGrouper(Grouper[Tuple[int, int]]):
    def group(self, row: List[str]) -> Tuple[int, int]:
        return int(row[7]), int(row[11]) if len(row) > 11 else 4

    def file_name(self, group: Tuple[int, int]) -> str:
        year, length = group
        return f"plans_{year}_{length}yr.csv"


class Options(NamedTuple, Generic[T]):
    source: str
    dir_path: str
    grouper: Grouper[T]


def main(options: "Options[T]") -> None:
    try:
        rmtree(options.dir_path)
    except FileNotFoundError:
        pass
    os.makedirs(options.dir_path)
    writers: Dict[T, CsvWriter] = {}
    with open(options.source, newline="") as file:
        reader = csv.reader(file)
        # Skip header
        next(reader)
        last_group: Optional[T] = None
        for row in reader:
            group = options.grouper.group(row)
            if group != last_group:
                writers[group] = CsvWriter(
                    len(row),
                    open(options.dir_path + options.grouper.file_name(group), "w"),
                )
                last_group = group
            writers[group].row(*row)
    for writer in writers.values():
        writer.done()
    with open(options.dir_path + ".done", "w") as file:
        pass


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("python3 (prereqs|plans) <path>")
    elif sys.argv[1] == "prereqs":
        main(
            Options(
                source=sys.argv[2],
                dir_path="./files/prereqs/",
                grouper=PrereqGrouper(),
            )
        )
    elif sys.argv[1] == "plans":
        main(
            Options(
                source=sys.argv[2],
                dir_path="./files/plans/",
                grouper=PlanGrouper(),
            )
        )
    else:
        print("python3 (prereqs|plans) <path>")
