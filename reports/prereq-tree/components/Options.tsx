/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

export type Options = {
  mode: 'blocked' | 'prereqs'
  unlockedOnly: boolean
  allAlts: boolean
}

export type OptionsProps = {
  options: Options
  onOptions: (options: Partial<Options>) => void
}
export function Options ({ options, onOptions }: OptionsProps) {
  return (
    <div class='controls'>
      {/* https://stackoverflow.com/a/45677146; <fieldset> can't be display: flex */}
      <div
        class='select-one-wrapper'
        role='radiogroup'
        aria-labelledby='mode-label'
      >
        <span class='select-one-label' id='mode-label'>
          Mode
        </span>
        <label class='select-button-wrapper'>
          <input
            class='select-radio'
            type='radio'
            name='mode'
            checked={options.mode === 'blocked'}
            onChange={() => onOptions({ mode: 'blocked' })}
          />
          <span class='select-button'>Blocked courses</span>
        </label>
        <label class='select-button-wrapper'>
          <input
            class='select-radio'
            type='radio'
            name='mode'
            checked={options.mode === 'prereqs'}
            onChange={() => onOptions({ mode: 'prereqs' })}
          />
          <span class='select-button'>Prerequisites</span>
        </label>
      </div>
      {options.mode === 'blocked' && (
        <label class='option'>
          <input
            class='toggle-checkbox'
            type='checkbox'
            onChange={e => onOptions({ unlockedOnly: e.currentTarget.checked })}
            checked={options.unlockedOnly}
          />{' '}
          <span class='toggle-shape'></span>
          Only show fully unlocked courses
        </label>
      )}
      {options.mode === 'prereqs' && (
        <label class='option' style={{ display: 'none' }}>
          <input
            class='toggle-checkbox'
            type='checkbox'
            onChange={e => onOptions({ allAlts: e.currentTarget.checked })}
            checked={options.allAlts}
          />{' '}
          <span class='toggle-shape'></span>
          Show all alternate prerequisites
        </label>
      )}
    </div>
  )
}
