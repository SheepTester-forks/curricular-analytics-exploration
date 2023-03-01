/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

export type ToggleProps = {
  checked?: boolean
  onCheck?: (checked: boolean) => void
}
export function Toggle ({ checked, onCheck }: ToggleProps) {
  return (
    <>
      <input
        type='checkbox'
        class='toggle-checkbox'
        checked={checked}
        onInput={e => onCheck?.(e.currentTarget.checked)}
      />
      <span class='toggle-shape' />
    </>
  )
}
