<div class="acp-page-container">
	<!-- IMPORT admin/partials/settings/header.tpl -->

	<div class="row m-0">
		<div id="spy-container" class="col-12 col-md-8 px-0 mb-4" tabindex="0">
			<form role="form" class="limf-settings">
				<div>
					<h5 class="fw-bold tracking-tight settings-header">New User Group</h5>
					<div class="mb-3">
						<label class="form-label" for="userGroup">Enter an existing group name</label>
						<input type="text" id="userGroup" name="userGroup" title="Group Name" class="form-control" placeholder="Group Name">
					</div>

					<h5 class="fw-bold tracking-tight settings-header">Custom Registration Fields</h5>

					<div class="mb-3">
						<label class="form-label" for="customFields">Custom Fields</label>
						<input type="text" id="customFields" name="customFields" title="Custom Fields" class="form-control" placeholder="{}">
						</input>
					</div>
				</div>
			</form>	
			<div class="mb-3">
				<h5 class="fw-bold tracking-tight">Current Custom Fields</h5>
				<hr />
				<style>
					table {
						border-collapse: collapse;
					}

					th, td {
						border: 1px solid black;
						padding: 8px;
					}

					th {
						text-align: left;
					}

					/* Style to indicate nesting levels */
					td.nested {
						border-left: 2px solid gray;
						padding-left: 16px;
					}
				</style>
				{{{ each customFields }}}
					<b>Interstitial/Grouping { @key }</b><br><br>
					{{{ each @value }}}
						{{{ each @value }}}
						<table>
							<tr>
							{{{ if isObject(@value) }}}
								{{{ each @value }}}
									{{{ each @value }}}
										<tr>
											<th>Option</th>
											<td>{ @key }</td>
											<td>{ @value }</td>
										</tr>
									{{{ end }}}
								{{{ end }}}
							{{{ else }}}
								<th>{ @key }</th>
								<td>{ @value }</td>
							{{{ end }}}
							</tr>
						</table>
						{{{ end }}}
					{{{ end }}}
					<hr />
				{{{ end }}}
			</div>
		</div>
		<!-- IMPORT admin/partials/settings/toc.tpl -->
	</div>
</div>
