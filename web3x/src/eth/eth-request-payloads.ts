/*
  This file is part of web3x.

  web3x is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  web3x is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with web3x.  If not, see <http://www.gnu.org/licenses/>.
*/

import { isString } from 'util';
import { Address } from '../address';
import {
  CallRequest,
  EstimateRequest,
  fromRawBlockResponse,
  fromRawLogResponse,
  fromRawTransactionReceipt,
  fromRawTransactionResponse,
  inputBlockNumberFormatter,
  inputSignFormatter,
  LogRequest,
  outputBigNumberFormatter,
  outputSyncingFormatter,
  PartialTransactionRequest,
  RawLogResponse,
  toRawCallRequest,
  toRawEstimateRequest,
  toRawLogRequest,
  toRawTransactionRequest,
  TransactionRequest,
} from '../formatters';
import { TransactionHash } from '../types';
import { Data } from '../types';
import { hexToNumber, isHexStrict, numberToHex } from '../utils';
import { BlockHash, BlockType } from './block';
import { SignedTransaction } from './signed-transaction';

const identity = <T>() => (result: T) => result;

export class EthRequestPayloads {
  constructor(public defaultFromAddress?: Address, private defaultBlock: BlockType = 'latest') {}

  public getDefaultBlock() {
    return this.defaultBlock;
  }

  public setDefaultBlock(block: BlockType) {
    this.defaultBlock = block;
  }

  public getId() {
    return {
      method: 'net_version',
      format: hexToNumber,
    };
  }

  public getNodeInfo() {
    return {
      method: 'web3_clientVersion',
      format: identity<string>(),
    };
  }

  public getProtocolVersion() {
    return {
      method: 'platon_protocolVersion',
      format: identity<string>(),
    };
  }

  public getCoinbase() {
    return {
      method: 'platon_coinbase',
      format: Address.fromString,
    };
  }

  public isMining() {
    return {
      method: 'platon_mining',
      format: identity<boolean>(),
    };
  }

  public getHashrate() {
    return {
      method: 'platon_hashrate',
      format: hexToNumber,
    };
  }

  public isSyncing() {
    return {
      method: 'platon_syncing',
      format: outputSyncingFormatter,
    };
  }

  public getGasPrice() {
    return {
      method: 'platon_gasPrice',
      format: outputBigNumberFormatter,
    };
  }

  public getAccounts() {
    return {
      method: 'platon_accounts',
      format: (result: string[]) => result.map(Address.fromString),
    };
  }

  public getBlockNumber() {
    return {
      method: 'platon_blockNumber',
      format: hexToNumber,
    };
  }

  public getBalance(address: Address, block?: BlockType) {
    return {
      method: 'platon_getBalance',
      params: [address.toString().toLowerCase(), inputBlockNumberFormatter(this.resolveBlock(block))],
      format: outputBigNumberFormatter,
    };
  }

  public getStorageAt(address: Address, position: string, block?: BlockType) {
    return {
      method: 'platon_getStorageAt',
      params: [
        address.toString().toLowerCase(),
        numberToHex(position),
        inputBlockNumberFormatter(this.resolveBlock(block)),
      ],
      format: identity<string>(),
    };
  }

  public getCode(address: Address, block?: BlockType) {
    return {
      method: 'platon_getCode',
      params: [address.toString().toLowerCase(), inputBlockNumberFormatter(this.resolveBlock(block))],
      format: identity<string>(),
    };
  }

  public getBlock(block: BlockType | BlockHash, returnTransactionObjects: boolean = false) {
    return {
      method: isString(block) && isHexStrict(block) ? 'platon_getBlockByHash' : 'platon_getBlockByNumber',
      params: [inputBlockNumberFormatter(this.resolveBlock(block)), returnTransactionObjects],
      format: fromRawBlockResponse,
    };
  }

  public getUncle(block: BlockType | BlockHash, uncleIndex: number, returnTransactionObjects: boolean = false) {
    return {
      method:
        isString(block) && isHexStrict(block) ? 'platon_getUncleByBlockHashAndIndex' : 'platon_getUncleByBlockNumberAndIndex',
      params: [inputBlockNumberFormatter(this.resolveBlock(block)), numberToHex(uncleIndex), returnTransactionObjects],
      format: fromRawBlockResponse,
    };
  }

  public getBlockTransactionCount(block: BlockType | BlockHash) {
    return {
      method:
        isString(block) && isHexStrict(block)
          ? 'platon_getBlockTransactionCountByHash'
          : 'platon_getBlockTransactionCountByNumber',
      params: [inputBlockNumberFormatter(this.resolveBlock(block))],
      format: hexToNumber,
    };
  }

  public getBlockUncleCount(block: BlockType | BlockHash) {
    return {
      method: isString(block) && isHexStrict(block) ? 'platon_getUncleCountByBlockHash' : 'platon_getUncleCountByBlockNumber',
      params: [inputBlockNumberFormatter(this.resolveBlock(block))],
      format: hexToNumber,
    };
  }

  public getTransaction(hash: TransactionHash) {
    return {
      method: 'platon_getTransactionByHash',
      params: [hash],
      format: fromRawTransactionResponse,
    };
  }

  public getTransactionFromBlock(block: BlockType | BlockHash, index: number) {
    return {
      method:
        isString(block) && isHexStrict(block)
          ? 'platon_getTransactionByBlockHashAndIndex'
          : 'platon_getTransactionByBlockNumberAndIndex',
      params: [inputBlockNumberFormatter(block), numberToHex(index)],
      format: fromRawTransactionResponse,
    };
  }

  public getTransactionReceipt(hash: TransactionHash) {
    return {
      method: 'platon_getTransactionReceipt',
      params: [hash],
      format: fromRawTransactionReceipt,
    };
  }

  public getTransactionCount(address: Address, block?: BlockType) {
    return {
      method: 'platon_getTransactionCount',
      params: [address.toString().toLowerCase(), inputBlockNumberFormatter(this.resolveBlock(block))],
      format: hexToNumber,
    };
  }

  public signTransaction(tx: TransactionRequest) {
    tx.from = tx.from || this.defaultFromAddress;
    return {
      method: 'platon_signTransaction',
      params: [toRawTransactionRequest(tx)],
      format: identity<SignedTransaction>(),
    };
  }

  public sendSignedTransaction(data: Data) {
    return {
      method: 'platon_sendRawTransaction',
      params: [data],
      format: identity<string>(),
    };
  }

  public sendTransaction(tx: PartialTransactionRequest) {
    const from = tx.from || this.defaultFromAddress;
    if (!from) {
      throw new Error('No from addres specified.');
    }
    return {
      method: 'platon_sendTransaction',
      params: [toRawTransactionRequest({ ...tx, from })],
      format: identity<string>(),
    };
  }

  public sign(address: Address, dataToSign: Data) {
    return {
      method: 'platon_sign',
      params: [address.toString().toLowerCase(), inputSignFormatter(dataToSign)],
      format: identity<string>(),
    };
  }

  public signTypedData(address: Address, dataToSign: { type: string; name: string; value: string }[]) {
    return {
      method: 'platon_signTypedData',
      params: [dataToSign, address.toString().toLowerCase()],
      format: identity<string>(),
    };
  }

  public call(tx: CallRequest, block?: BlockType) {
    tx.from = tx.from || this.defaultFromAddress;
    return {
      method: 'platon_call',
      params: [toRawCallRequest(tx), inputBlockNumberFormatter(this.resolveBlock(block))],
      format: identity<string>(),
    };
  }

  public estimateGas(tx: EstimateRequest) {
    tx.from = tx.from || this.defaultFromAddress;
    return {
      method: 'platon_estimateGas',
      params: [toRawEstimateRequest(tx)],
      format: hexToNumber,
    };
  }

  public submitWork(nonce: string, powHash: string, digest: string) {
    return {
      method: 'platon_submitWork',
      params: [nonce, powHash, digest],
      format: identity<boolean>(),
    };
  }

  public getWork() {
    return {
      method: 'platon_getWork',
      format: identity<string[]>(),
    };
  }

  public getPastLogs(options: LogRequest) {
    return {
      method: 'platon_getLogs',
      params: [toRawLogRequest(options)],
      format: (result: RawLogResponse[]) => result.map(fromRawLogResponse),
    };
  }

  private resolveBlock(block?: BlockType | BlockHash) {
    return block === undefined ? this.defaultBlock : block;
  }
}
