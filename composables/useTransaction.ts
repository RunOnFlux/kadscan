const TX_QUERY = `
{
  "data": {
    "transaction": {
      "hash": "kkc2uO-6goraC9udbVLFYilJuz0ZyGt1-ExzcbOWdV0",
      "cmd": {
        "meta": {
          "chainId": 0,
          "creationTime": "2025-07-22T23:19:14.000Z",
          "gasLimit": "15000",
          "gasPrice": "0.0000001",
          "sender": "k:7c5c0f93cb80f82f090f8e9a1414407e802c3dbe01fb99a85d7875c6e49ee9e8",
          "ttl": "28800"
        },
        "networkId": "mainnet01",
        "nonce": "2025-07-22T23:19:29.336Z",
        "payload": {
          "code": "\"(free.radio02.close-send-receive \"k:162985e958aa03c09f2e861d91fd99be164943a6aa39eb3f40c3df1969656fe7\" [{\"address\":\"k:4f610c22bb6f869ac00cde1e32224cdff1c61087dfca684a6251ee7652884fef\",\"gatewayId\":\"e45f01fffe22b121\",\"mic\":\"d4186bbc\"}] [] )\"",
          "data": "{\"keyset\":{\"keys\":[\"7c5c0f93cb80f82f090f8e9a1414407e802c3dbe01fb99a85d7875c6e49ee9e8\"],\"pred\":\"keys-all\"}}"
        },
        "signers": [
          {
            "address": null,
            "clist": [],
            "id": "U2lnbmVyOlsia2tjMnVPLTZnb3JhQzl1ZGJWTEZZaWxKdXowWnlHdDEtRXh6Y2JPV2RWMCIsIjAiXQ==",
            "orderIndex": 0,
            "pubkey": "7c5c0f93cb80f82f090f8e9a1414407e802c3dbe01fb99a85d7875c6e49ee9e8",
            "scheme": ""
          }
        ]
      },
      "id": "VHJhbnNhY3Rpb246WyIwTllCUkdIaWsyWWoyWncwcl80ejliU3dSUWYyaW9CSDVpR0tjelowLUs4Iiwia2tjMnVPLTZnb3JhQzl1ZGJWTEZZaWxKdXowWnlHdDEtRXh6Y2JPV2RWMCJd",
      "orphanedTransactions": [],
      "sigs": [
        {
          "sig": "16b741ac97e6aab4ce83d592d1057059fd92605eb2181a88d575c66cbd097a37f49bde04db2f33ce5e1a52c8403f9f979d2454ab2e1cf81a47b5e6e7ed278a03"
        }
      ],
      "result": {
        "badResult": null,
        "block": {
          "chainId": 0,
          "canonical": true,
          "height": 6024600
        },
        "continuation": null,
        "eventCount": 4,
        "events": {
          "totalCount": 4,
          "edges": [
            {
              "node": {
                "id": "RXZlbnQ6WyIwTllCUkdIaWsyWWoyWncwcl80ejliU3dSUWYyaW9CSDVpR0tjelowLUs4IiwiMyIsImtrYzJ1Ty02Z29yYUM5dWRiVkxGWWlsSnV6MFp5R3QxLUV4emNiT1dkVjAiXQ==",
                "height": 6024600,
                "chainId": 0,
                "moduleName": "coin",
                "name": "TRANSFER",
                "orderIndex": 3,
                "parameterText": "[\"k:7c5c0f93cb80f82f090f8e9a1414407e802c3dbe01fb99a85d7875c6e49ee9e8\",\"k:251efb06f3b798dbe7bb3f58f535b67b0a9ed2da9aa4e2367be4abc07cc927fa\",0.0001722]",
                "parameters": "[\"k:7c5c0f93cb80f82f090f8e9a1414407e802c3dbe01fb99a85d7875c6e49ee9e8\",\"k:251efb06f3b798dbe7bb3f58f535b67b0a9ed2da9aa4e2367be4abc07cc927fa\",0.0001722]",
                "qualifiedName": "coin.TRANSFER",
                "requestKey": "kkc2uO-6goraC9udbVLFYilJuz0ZyGt1-ExzcbOWdV0"
              }
            },
            {
              "node": {
                "id": "RXZlbnQ6WyIwTllCUkdIaWsyWWoyWncwcl80ejliU3dSUWYyaW9CSDVpR0tjelowLUs4IiwiMiIsImtrYzJ1Ty02Z29yYUM5dWRiVkxGWWlsSnV6MFp5R3QxLUV4emNiT1dkVjAiXQ==",
                "height": 6024600,
                "chainId": 0,
                "moduleName": "free.crankk01",
                "name": "TRANSFER",
                "orderIndex": 2,
                "parameterText": "[\"radio01-award-bank\",\"k:7c5c0f93cb80f82f090f8e9a1414407e802c3dbe01fb99a85d7875c6e49ee9e8\",0.1413]",
                "parameters": "[\"radio01-award-bank\",\"k:7c5c0f93cb80f82f090f8e9a1414407e802c3dbe01fb99a85d7875c6e49ee9e8\",0.1413]",
                "qualifiedName": "free.crankk01.TRANSFER",
                "requestKey": "kkc2uO-6goraC9udbVLFYilJuz0ZyGt1-ExzcbOWdV0"
              }
            },
            {
              "node": {
                "id": "RXZlbnQ6WyIwTllCUkdIaWsyWWoyWncwcl80ejliU3dSUWYyaW9CSDVpR0tjelowLUs4IiwiMSIsImtrYzJ1Ty02Z29yYUM5dWRiVkxGWWlsSnV6MFp5R3QxLUV4emNiT1dkVjAiXQ==",
                "height": 6024600,
                "chainId": 0,
                "moduleName": "free.crankk01",
                "name": "TRANSFER",
                "orderIndex": 1,
                "parameterText": "[\"radio01-award-bank\",\"k:4f610c22bb6f869ac00cde1e32224cdff1c61087dfca684a6251ee7652884fef\",1.31296]",
                "parameters": "[\"radio01-award-bank\",\"k:4f610c22bb6f869ac00cde1e32224cdff1c61087dfca684a6251ee7652884fef\",1.31296]",
                "qualifiedName": "free.crankk01.TRANSFER",
                "requestKey": "kkc2uO-6goraC9udbVLFYilJuz0ZyGt1-ExzcbOWdV0"
              }
            },
            {
              "node": {
                "id": "RXZlbnQ6WyIwTllCUkdIaWsyWWoyWncwcl80ejliU3dSUWYyaW9CSDVpR0tjelowLUs4IiwiMCIsImtrYzJ1Ty02Z29yYUM5dWRiVkxGWWlsSnV6MFp5R3QxLUV4emNiT1dkVjAiXQ==",
                "height": 6024600,
                "chainId": 0,
                "moduleName": "free.crankk01",
                "name": "TRANSFER",
                "orderIndex": 0,
                "parameterText": "[\"radio01-award-bank\",\"k:162985e958aa03c09f2e861d91fd99be164943a6aa39eb3f40c3df1969656fe7\",1.35648]",
                "parameters": "[\"radio01-award-bank\",\"k:162985e958aa03c09f2e861d91fd99be164943a6aa39eb3f40c3df1969656fe7\",1.35648]",
                "qualifiedName": "free.crankk01.TRANSFER",
                "requestKey": "kkc2uO-6goraC9udbVLFYilJuz0ZyGt1-ExzcbOWdV0"
              }
            }
          ]
        },
        "gas": "1722",
        "goodResult": "\"\"",
        "transactionId": "526937393",
        "logs": "3rYv9AoccWjULppesBhkJKLzIdxFxWrVDwoM33HNY1A",
        "transfers": {
          "totalCount": 1,
          "edges": [
            {
              "node": {
                "amount": "0.0001722",
                "creationTime": "2025-07-22T23:19:14.000Z",
                "id": "VHJhbnNmZXI6WyIwTllCUkdIaWsyWWoyWncwcl80ejliU3dSUWYyaW9CSDVpR0tjelowLUs4IiwiMCIsIjMiLCJrbEZrckxmcHlMVy1NM3hqVlBTZHFYRU1neFBQSmliUnRfRDZxaUJ3czZzIiwia2tjMnVPLTZnb3JhQzl1ZGJWTEZZaWxKdXowWnlHdDEtRXh6Y2JPV2RWMCJd",
                "crossChainTransfer": null,
                "moduleHash": "klFkrLfpyLW-M3xjVPSdqXEMgxPPJibRt_D6qiBws6s",
                "moduleName": "coin",
                "orderIndex": 3,
                "receiverAccount": "k:251efb06f3b798dbe7bb3f58f535b67b0a9ed2da9aa4e2367be4abc07cc927fa",
                "requestKey": "kkc2uO-6goraC9udbVLFYilJuz0ZyGt1-ExzcbOWdV0",
                "senderAccount": "k:7c5c0f93cb80f82f090f8e9a1414407e802c3dbe01fb99a85d7875c6e49ee9e8"
              }
            },
            {
              "node": {
                "amount": "0.1413",
                "creationTime": "2025-07-22T23:19:14.000Z",
                "id": "VHJhbnNmZXI6WyIwTllCUkdIaWsyWWoyWncwcl80ejliU3dSUWYyaW9CSDVpR0tjelowLUs4IiwiMCIsIjIiLCJCNURsTnQ4T2E1VG53UUhneEszQlowbFdGM0pvdW94WmhWOWN5ZHNmQlRBIiwia2tjMnVPLTZnb3JhQzl1ZGJWTEZZaWxKdXowWnlHdDEtRXh6Y2JPV2RWMCJd",
                "crossChainTransfer": null,
                "moduleHash": "B5DlNt8Oa5TnwQHgxK3BZ0lWF3JouoxZhV9cydsfBTA",
                "moduleName": "free.crankk01",
                "orderIndex": 2,
                "receiverAccount": "k:7c5c0f93cb80f82f090f8e9a1414407e802c3dbe01fb99a85d7875c6e49ee9e8",
                "requestKey": "kkc2uO-6goraC9udbVLFYilJuz0ZyGt1-ExzcbOWdV0",
                "senderAccount": "radio01-award-bank"
              }
            },
            {
              "node": {
                "amount": "1.31296",
                "creationTime": "2025-07-22T23:19:14.000Z",
                "id": "VHJhbnNmZXI6WyIwTllCUkdIaWsyWWoyWncwcl80ejliU3dSUWYyaW9CSDVpR0tjelowLUs4IiwiMCIsIjEiLCJCNURsTnQ4T2E1VG53UUhneEszQlowbFdGM0pvdW94WmhWOWN5ZHNmQlRBIiwia2tjMnVPLTZnb3JhQzl1ZGJWTEZZaWxKdXowWnlHdDEtRXh6Y2JPV2RWMCJd",
                "crossChainTransfer": null,
                "moduleHash": "B5DlNt8Oa5TnwQHgxK3BZ0lWF3JouoxZhV9cydsfBTA",
                "moduleName": "free.crankk01",
                "orderIndex": 1,
                "receiverAccount": "k:4f610c22bb6f869ac00cde1e32224cdff1c61087dfca684a6251ee7652884fef",
                "requestKey": "kkc2uO-6goraC9udbVLFYilJuz0ZyGt1-ExzcbOWdV0",
                "senderAccount": "radio01-award-bank"
              }
            },
            {
              "node": {
                "amount": "1.35648",
                "creationTime": "2025-07-22T23:19:14.000Z",
                "id": "VHJhbnNmZXI6WyIwTllCUkdIaWsyWWoyWncwcl80ejliU3dSUWYyaW9CSDVpR0tjelowLUs4IiwiMCIsIjAiLCJCNURsTnQ4T2E1VG53UUhneEszQlowbFdGM0pvdW94WmhWOWN5ZHNmQlRBIiwia2tjMnVPLTZnb3JhQzl1ZGJWTEZZaWxKdXowWnlHdDEtRXh6Y2JPV2RWMCJd",
                "crossChainTransfer": null,
                "moduleHash": "B5DlNt8Oa5TnwQHgxK3BZ0lWF3JouoxZhV9cydsfBTA",
                "moduleName": "free.crankk01",
                "orderIndex": 0,
                "receiverAccount": "k:162985e958aa03c09f2e861d91fd99be164943a6aa39eb3f40c3df1969656fe7",
                "requestKey": "kkc2uO-6goraC9udbVLFYilJuz0ZyGt1-ExzcbOWdV0",
                "senderAccount": "radio01-award-bank"
              }
            }
          ]
        }
      }
    }
  }
}
`;