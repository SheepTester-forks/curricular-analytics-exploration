/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { render } from 'preact'
import { App } from './plan-editor/components/App.tsx'

render(
  <App
    prereqs={
      JSON.parse(document.getElementById('prereqs')?.textContent ?? 'null') ||
      // deno-lint-ignore no-explicit-any
      (window as any)['PREREQS']
    }
    initPlan={{
      startYear: '2021',
      years: [
        [
          [
            {
              title: 'CSE 8A',
              units: '4',
              requirement: { college: true, major: true }
            },
            {
              title: 'MATH 20A',
              units: '4',
              requirement: { college: true, major: true }
            },
            {
              title: 'CAT 1',
              units: '4',
              requirement: { college: true, major: false }
            },
            {
              title: 'GE',
              units: '4',
              requirement: { college: true, major: false }
            }
          ],
          [
            {
              title: 'CSE 8B',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'MATH 20B',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE 20',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CAT 2',
              units: '6',
              requirement: { college: true, major: false }
            }
          ],
          [
            {
              title: 'PHYS 2A',
              units: '4',
              requirement: { college: true, major: true }
            },
            {
              title: 'MATH 18',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE 12',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE 15L',
              units: '2',
              requirement: { college: false, major: true }
            },
            {
              title: 'CAT 3',
              units: '6',
              requirement: { college: true, major: false }
            }
          ]
        ],
        [
          [
            {
              title: 'ECE 35',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'PHYS 2B',
              units: '4',
              requirement: { college: true, major: true }
            },
            {
              title: 'MATH 20C',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE 21',
              units: '4',
              requirement: { college: false, major: true }
            }
          ],
          [
            {
              title: 'PHYS 2C',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE 30',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'MATH 20D',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'ECE 45',
              units: '4',
              requirement: { college: false, major: true }
            }
          ],
          [
            {
              title: 'ECE 65',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE 100',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'ECE 109',
              units: '4',
              requirement: { college: true, major: true }
            },
            {
              title: 'GE',
              units: '4',
              requirement: { college: true, major: false }
            }
          ]
        ],
        [
          [
            {
              title: 'CSE 110',
              units: '4',
              requirement: { college: true, major: true }
            },
            {
              title: 'CSE / ECE ELECTIVE',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE 101',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CAT 125',
              units: '4',
              requirement: { college: true, major: false }
            }
          ],
          [
            {
              title: 'ECE 101',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE 140L',
              units: '2',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE 140',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'GE / DEI',
              units: '4',
              requirement: { college: true, major: false }
            }
          ],
          [
            {
              title: 'CSE 141 (OR CSE 142)',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE 141L (OR CSE 142L)',
              units: '2',
              requirement: { college: false, major: true }
            },
            {
              title: 'TECHNICAL ELECTIVE',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'ECE 111 (OR ECE 140B)',
              units: '4',
              requirement: { college: false, major: true }
            }
          ]
        ],
        [
          [
            {
              title: 'CSE 120',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE / ECE ELECTIVE',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'GE',
              units: '4',
              requirement: { college: true, major: false }
            }
          ],
          [
            {
              title: 'ECE 108',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE / ECE ELECTIVE',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'GE',
              units: '4',
              requirement: { college: true, major: false }
            }
          ],
          [
            {
              title: 'CSE / ECE ELECTIVE',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'CSE / ECE ELECTIVE',
              units: '4',
              requirement: { college: false, major: true }
            },
            {
              title: 'GE',
              units: '4',
              requirement: { college: true, major: false }
            }
          ]
        ]
      ],
      departmentCode: 'CSE',
      majorName: 'Computer Engineering',
      majorCode: 'CS25',
      cipCode: '14.0901',
      collegeCode: 'SI',
      collegeName: 'Sixth',
      degreeType: 'BS'
    }}
    mode='advisor'
  />,
  document.getElementById('root')!
)
