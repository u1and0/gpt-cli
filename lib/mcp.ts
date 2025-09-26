/**
 * MCP (Model Context Protocol) サーバー管理クラス
 * 複数の MCP サーバーとの接続、ツール取得、クリーンアップを管理する
 */

import { MultiServerMCPClient } from "npm:@langchain/mcp-adapters";

/** MCP サーバーの設定型 */
export type MCPServerConfig = {
  command: string;
  args: string[];
  transport: "stdio" | "streamable_http";
  url?: string;
};

/** MCP 設定ファイルの型 */
export type MCPConfig = {
  [serverName: string]: MCPServerConfig;
};

/** MCP サーバー管理クラス */
export class MCPManager {
  private client?: MultiServerMCPClient;
  // @ts-ignore any allow
  private tools?: any[];
  private isInitialized = false;

  /**
   * MCP クライアントを初期化する
   * @param configPath - MCP 設定ファイルのパス（オプション）
   * @throws {Error} - 設定ファイル読み込みエラー、クライアント初期化エラー
   */
  async initialize(configPath?: string): Promise<void> {
    try {
      if (!configPath) {
        console.log(
          "MCP config path not provided, skipping MCP initialization",
        );
        return;
      }

      // JSON設定ファイルを読み込み
      console.log(`Loading MCP config from: ${configPath}`);
      const jsonText = await Deno.readTextFile(configPath);
      const config: MCPConfig = JSON.parse(jsonText);

      if (Object.keys(config).length === 0) {
        console.log("No MCP servers configured");
        return;
      }

      // MCPクライアント初期化
      this.client = new MultiServerMCPClient({
        mcpServers: config as any, // 型の不一致を回避
        throwOnLoadError: true,
        prefixToolNameWithServerName: false,
      });

      this.isInitialized = true;

      console.log(
        `Initialized MCP client with ${Object.keys(config).length} servers`,
      );
    } catch (error) {
      console.error("Error initializing MCP client:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      throw new Error(`Failed to initialize MCP client: ${errorMessage}`);
    }
  }

  /**
   * MCPサーバーからツールを取得する
   * @returns {Promise<any[]>} ツールの配列
   * @throws {Error} - クライアント未初期化エラー、ツール取得エラー
   */
  async getTools(): Promise<any[]> {
    if (!this.isInitialized || !this.client) {
      return []; // MCP が初期化されていない場合は空の配列を返す
    }

    try {
      if (!this.tools) {
        this.tools = await this.client.getTools();
        console.log(`Retrieved ${this.tools.length} MCP tools`);
      }
      return this.tools;
    } catch (error) {
      console.error("Error getting MCP tools:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      throw new Error(`Failed to get MCP tools: ${errorMessage}`);
    }
  }

  /**
   * MCP クライアントを閉じる
   * リソースのクリーンアップを行う
   */
  async close(): Promise<void> {
    try {
      if (this.client && this.isInitialized) {
        await this.client.close();
        console.log("MCP client closed");
      }
      this.client = undefined;
      this.tools = undefined;
      this.isInitialized = false;
    } catch (error) {
      console.error("Error closing MCP client:", error);
    }
  }

  /**
   * MCP クライアントが初期化済みかどうかを確認
   * @returns {boolean} 初期化済みの場合 true
   */
  isReady(): boolean {
    return this.isInitialized && this.client !== undefined;
  }

  /**
   * 利用可能なツール数を取得
   * @returns {number} ツール数
   */
  getToolCount(): number {
    return this.tools?.length ?? 0;
  }
}

/**
 * デフォルトの MCP 設定例を生成する
 * 開発時のサンプル用
 */
export function createDefaultMCPConfig(): MCPConfig {
  return {
    math: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-math"],
      transport: "stdio",
    },
  };
}
