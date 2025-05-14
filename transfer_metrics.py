"""
python3 transfer_metrics.py './files/CA_MetricsforMap_FINAL(Applicant Type_Major).csv' './files/CA_MetricsforMap_FINAL(Metrics).csv' > './files/protected/CA_MetricsforMap_FINAL(Metrics 2).csv'
"""

import csv 
import sys
import pandas as pd

# For each major, compare transfer vs first year
# If there exists a transfer impact vs no first year impact, we say there's a Transfer Disproportionate Impact

def main():
    if len(sys.argv) < 3:
        print("python3 transfer_metrics.py <path> <path>")
        exit(1)

    transfer_metrics = pd.read_csv(sys.argv[1])

    total_metrics = pd.read_csv(sys.argv[2])
    total_metrics.insert(loc=6, column='Transfer Disproportionate Impact', value='')

    transfer_metrics.groupby(['Course ID', 'Dept Cd'])
    print(transfer_metrics)

    total_metrics.to_csv('transfer_metrics_output.csv', index=False)

if __name__ == "__main__":
    main()