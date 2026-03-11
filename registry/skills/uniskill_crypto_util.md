---
id: "uniskill_crypto_util"
name: "Crypto & Encoding"
emoji: "🔐"
status: "Official"
costPerCall: 0.1
category: "utilities"
tags: ["crypto", "hash", "base64", "uuid", "native"]
gradientFrom: "from-slate-700"
gradientTo: "to-gray-900"
---

# Crypto & Encoding Toolkit

## Description
A professional utility suite enabling LLMs to strictly perform deterministic cryptographic operations, encoding, and unique identifier generation without hallucinations.

## Parameters
```json
{
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "enum": ["base64_encode", "base64_decode", "md5", "sha256", "uuid_v4"],
      "description": "The specific cryptographic or encoding operation to perform."
    },
    "data": {
      "type": "string",
      "description": "The input string data to process. Leave empty if operation is 'uuid_v4'."
    }
  },
  "required": ["operation"]
}
```

## Setup Instructions
No setup or API key is required. This is a native UniSkill engine powered by high-performance edge runtime.

## Implementation YAML
```yaml
# Logic: Identification for applying UniSkill native optimizations
type: native
endpoint: "internal"
method: "POST"
```
