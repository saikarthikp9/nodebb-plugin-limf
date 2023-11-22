"use strict";

/*
	This file is located in the "modules" block of plugin.json
	It is only loaded when the user navigates to /admin/plugins/limf page
	It is not bundled into the min file that is served on the first load of the page.
*/

import { save, load } from "settings";
import * as uploader from "uploader";

export function init() {
  handleSettingsForm();
}

function handleSettingsForm() {
  load("limf", $(".limf-settings"));
  console.log("handleSettingsForm");
  console.log($(".limf-settings"));
  console.log("####################HERE ^^#####################");

  $("#save").on("click", () => {
    console.log("Saving settings");
    console.log($(".limf-settings"));
    // TODO: set limf-settings after JSON.parse or dont save that part and maybe even show error
    save("limf", $(".limf-settings")); // pass in a function in the 3rd parameter to override the default success/failure handler
  });
}
