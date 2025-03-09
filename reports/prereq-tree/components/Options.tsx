export type Options = {
  mode: 'blocked' | 'prereqs'
  unlockedOnly: boolean
  allAlts: boolean
  tidyTree: boolean
}

export type OptionsProps = {
  options: Options
  onOptions: (options: Partial<Options>) => void
}
export function Options ({ options, onOptions }: OptionsProps) {
  return (
    <div className='controls'>
      {/* https://stackoverflow.com/a/45677146; <fieldset> can't be display: flex */}
      <div
        className='select-one-wrapper'
        role='radiogroup'
        aria-labelledby='mode-label'
      >
        <span className='select-one-label' id='mode-label'>
          Mode
        </span>
        <label className='select-button-wrapper'>
          <input
            className='select-radio'
            type='radio'
            name='mode'
            checked={options.mode === 'blocked'}
            onChange={() => onOptions({ mode: 'blocked' })}
          />
          <span className='select-button'>Blocked courses</span>
        </label>
        <label className='select-button-wrapper'>
          <input
            className='select-radio'
            type='radio'
            name='mode'
            checked={options.mode === 'prereqs'}
            onChange={() => onOptions({ mode: 'prereqs' })}
          />
          <span className='select-button'>Prerequisites</span>
        </label>
      </div>
      {options.mode === 'blocked' && (
        <label className='option'>
          <input
            className='toggle-checkbox'
            type='checkbox'
            onChange={e => onOptions({ unlockedOnly: e.currentTarget.checked })}
            checked={options.unlockedOnly}
          />{' '}
          <span className='toggle-shape'></span>
          Only show fully unlocked courses
        </label>
      )}
      {options.mode === 'prereqs' && (
        <label className='option' style={{ display: 'none' }}>
          <input
            className='toggle-checkbox'
            type='checkbox'
            onChange={e => onOptions({ allAlts: e.currentTarget.checked })}
            checked={options.allAlts}
          />{' '}
          <span className='toggle-shape'></span>
          Show all alternate prerequisites
        </label>
      )}
      {options.mode === 'prereqs' && (
        <label className='option'>
          <input
            className='toggle-checkbox'
            type='checkbox'
            onChange={e => onOptions({ tidyTree: e.currentTarget.checked })}
            checked={options.tidyTree}
          />{' '}
          <span className='toggle-shape'></span>
          Flatten tree
        </label>
      )}
    </div>
  )
}
