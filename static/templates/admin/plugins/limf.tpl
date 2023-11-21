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
				<table>
					<thead>
						<tr>
						<th>Interstitial</th>
						<th>Label</th>
						<th>Placeholder</th>
						<th>Help Text</th>
						<th>Type</th>
						<th>Validation Type</th>
						<th>Required</th>
						<th>Autocomplete</th>
						</tr>
					</thead>
					<tbody>
						{{{ each customFields }}}
							<tr>
								{{{ each @value }}}
									<td>{ @key }</td>
									<td>{ ./label }</td>
									<td>{ ./placeholder }</td>
									<td>{ ./help_text }</td>
									<td>{ ./type }</td>
									<td>{ ./validation_type }</td>
									<td>{ ./required }</td>
									<td>{ ./autocomplete }</td>
								{{{ end }}}
							</tr>
						{{{ end }}}
						
					</tbody>
				</table>
				{ customFields }
				{{{ each customFields }}}
					{{{ each @value }}}
						{ @key }: { @value }
					{{{ end }}}
				{{{ end }}}
				{{{ each customFields }}}
					{{{ each @value }}}
						{ ./label }
					{{{ end }}}
				{{{ end }}}
				<!-- BEGIN customFields -->
					{{#each customFields}}
						{{#each this}}
							{{@key}}: {{this}}
						{{/each}}
					{{/each}}
				<!-- END -->
			</div>
		</div>


		<!-- IMPORT admin/partials/settings/toc.tpl -->
		
	</div>
</div>
