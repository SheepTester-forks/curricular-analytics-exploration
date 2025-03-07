// Run in the CMS folder view to replace HTML reports

async function writeFile (fileId, contents, message) {
    const editForm = await fetch(`/entity/edit.act?id=${fileId}&type=file`).then(r => r.text())
  const submittedFormIdentifier = (
    editForm
  ).match(
    /<input type="hidden" name="submittedFormIdentifier" id="submittedFormIdentifier" value="([0-9a-z]+)"\/>/
  )[1]
    const metadataSetId = (
    editForm
  ).match(
    /<input type="hidden" name="metadataSetId" value="([0-9a-z]+)" \/>/
  )[1]

  let formData = new FormData()
  formData.set('submittedFormIdentifier', submittedFormIdentifier)
  formData.set('id', fileId)
  formData.set('bytesAsString', contents)
  formData.set('shouldBeIndexed', 'on')
  formData.set('shouldBePublished', 'on')
  formData.set('customLinkRewriting', 'ABSOLUTE')
  formData.set('metadataSetId', metadataSetId)
  formData.set('oldMetadataSetId', metadataSetId)

  const { forward } = await fetch('/entity/submitfile.act?saveAs=draft&backgroundSave=false', {
    body: formData,
    method: 'POST'
  }).then(r => r.ok ? r.json() : r.text().then(console.warn))

  const submitId = (
    await fetch(forward).then(r => r.text())
  ).match(/<input type="hidden" name="id" id="id" value="([0-9a-z]+)"\/>/)[1]

  formData = new FormData()
  formData.set('type', 'file')
  formData.set('id', submitId)
  formData.set('dataCheckSettings.comments', message)

  await fetch('/entity/submitDraft.act?submitButtonType=submit', {
    method: 'POST',
    body: formData
  })
}

for (const assetRow of document.querySelectorAll(
  '#DataTables_Table_0_wrapper td:nth-child(2)'
)) {
  const assetId = new URL(assetRow.children[0].href).searchParams.get('id')
  const label = document.createElement('label')
  const fileInput = Object.assign(document.createElement('input'), {
    type: 'file'
  })
  label.append('Replace file: ', fileInput)
  assetRow.append(label)

  fileInput.addEventListener('change', async () => {
    if (fileInput.files[0]) {
      fileInput.disabled = true
      await writeFile(
        assetId,
        await fileInput.files[0].text(),
        prompt('Change message')
      )
      fileInput.value = ''
      fileInput.disabled = false
    }
  })
}
