// get data from a shelly plus s and save on the local shelly in two virtual components
// Configuration
let CONFIG = {
  remoteIp: "x.x.x.x",       // pro 3em
  remoteAuth: "admin:AUTHPW", // Set to "admin:password" if auth required, or null
  remoteMethod: "Shelly.GetStatus", // RPC method to call
  remoteParams: null,               // No parameters needed for GetStatus
  pollInterval: 60,                 // Poll interval in seconds

  // Virtual component mappings
  virtualComponents: [
    { id: 202, path: ["switch:0", "aenergy","total"], type: "number", decimals: 2 },  // Energy total_act (2 decimal places)
    { id: 203, path: ["switch:0", "apower"], type: "number", decimals: 0 } // Power (0 decimal place)
  ]
};

// Extract value from RPC response using path array
function extractValue(response, path) {
  let value = response;
  
  for (let i = 0; i < path.length; i++) {
    if (value && value[path[i]] !== undefined) {
      value = value[path[i]];
    } else {
      console.log("Could not find path:", path.join("."));
      return null;
    }
  }
  
  return value;
}

// Function to call RPC on remote Shelly
function callRemoteRPC() {
  let rpcUrl = "http://";
  
  // Add authentication if configured
  if (CONFIG.remoteAuth !== null) {
    rpcUrl += CONFIG.remoteAuth + "@";
  }
  
  rpcUrl += CONFIG.remoteIp + "/rpc/" + CONFIG.remoteMethod;
  
  Shelly.call(
    "HTTP.GET",
    {
      url: rpcUrl,
      timeout: 5,
    },
    function (result, error_code, error_message) {
      if (error_code !== 0) {
        console.log("RPC call failed:", error_message);
        return;
      }
      
      try {
        let response = JSON.parse(result.body);
        
        // Process each virtual component mapping
        for (let i = 0; i < CONFIG.virtualComponents.length; i++) {
          let component = CONFIG.virtualComponents[i];
          let value = extractValue(response, component.path);
          
          if (value !== null) {
            // Round to specified decimal places if configured
            if (component.decimals !== undefined && typeof value === "number") {
              value = Math.round(value * Math.pow(10, component.decimals)) / Math.pow(10, component.decimals);
            }
            
            updateVirtualComponent(component.id, value, component.type);
          }
        }
      } catch (e) {
        console.log("Error parsing response:", e);
      }
    }
  );
}

// Function to update the virtual component
function updateVirtualComponent(virtualId, value, virtualType) {
  let method = "Number.Set";
  let param = "value";
  
  if (virtualType === "text") {
    method = "Text.Set";
  } else if (virtualType === "boolean") {
    method = "Boolean.Set";
  }
  
  let params = { id: virtualId };
  params[param] = value;
  
  Shelly.call(
    method,
    params,
    function (result, error_code, error_message) {
      if (error_code !== 0) {
        console.log("Failed to update virtual component", virtualId, ":", error_message);
      } else {
        console.log("Virtual component", virtualId, "updated:", value);
      }
    }
  );
}

// Initialize: call immediately and then set up timer
console.log("getting pv data via RPC to Virtual Component script");
callRemoteRPC();

// Set up periodic polling
Timer.set(
  CONFIG.pollInterval * 1000,
  true,
  callRemoteRPC
);  
