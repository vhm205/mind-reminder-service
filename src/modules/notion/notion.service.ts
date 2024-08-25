import { Injectable } from '@nestjs/common';
import { Client } from '@notionhq/client';
import env from '@environments';

@Injectable()
export class NotionService {
  private notion: Client;

  constructor() {
    // Initializing a client
    this.notion = new Client({
      auth: env.NOTION_SECRET,
    });
  }

  insertDatabase(pageId: string, payload: Record<string, any>) {
    return new Promise(async (resolve) => {
      try {
        const newDatabase = await this.notion.databases.create({
          parent: {
            type: 'page_id',
            page_id: pageId,
          },
          title: [
            {
              type: 'text',
              text: {
                content: payload.title,
              },
            },
          ],
          properties: {
            Title: {
              type: 'title',
              title: {},
            },
            Ref: {
              type: 'url',
              url: {},
            },
            Created: {
              type: 'created_time',
              created_time: {},
            },
            'Last edited time': {
              type: 'last_edited_time',
              last_edited_time: {},
            },
          },
        });

        return resolve({ error: false, data: newDatabase });
      } catch (error) {
        return resolve({ error: true, message: error.message });
      }
    });
  }

  insertPage(databaseId: string, payload: Record<string, any>) {
    return new Promise(async (resolve) => {
      try {
        const newPage = await this.notion.pages.create({
          parent: {
            type: 'database_id',
            database_id: databaseId,
          },
          icon: {
            type: 'emoji',
            emoji: '🥬',
          },
          properties: {
            Title: {
              title: [
                {
                  text: {
                    content: payload.title,
                  },
                },
              ],
            },
          },
        });

        return resolve({ error: false, data: newPage });
      } catch (error) {
        return resolve({ error: true, message: error.message });
      }
    });
  }

  insertBlock(blockId: string, payload: Record<string, any>) {
    return new Promise(async (resolve) => {
      try {
        const newBlock = await this.notion.blocks.children.append({
          block_id: blockId,
          children: [
            {
              paragraph: {
                rich_text: [
                  {
                    text: {
                      content: payload.blocks,
                    },
                  },
                ],
              },
            },
            {
              paragraph: {
                rich_text: [
                  {
                    text: {
                      content: payload.markdown,
                    },
                  },
                ],
              },
            },
            {
              paragraph: {
                rich_text: [
                  {
                    text: {
                      content: payload.html,
                    },
                  },
                ],
              },
            },
          ],
        });

        return resolve({ error: false, data: newBlock });
      } catch (error) {
        return resolve({ error: true, message: error.message });
      }
    });
  }

  updateBlock({ blockId, payload }: any) {
    return new Promise(async (resolve) => {
      try {
        const result = await this.notion.blocks.update({
          block_id: blockId,
          ...payload,
        });

        return resolve({ error: false, data: result });
      } catch (error) {
        return resolve({ error: true, message: error.message });
      }
    });
  }

  updatePage({ pageId, properties }: any) {
    return new Promise(async (resolve) => {
      try {
        const result = await this.notion.pages.update({
          page_id: pageId,
          properties,
        });

        return resolve({ error: false, data: result });
      } catch (error) {
        return resolve({ error: true, message: error.message });
      }
    });
  }

  movePageToTrash({ pageId }: any) {
    return new Promise(async (resolve) => {
      try {
        const result = await this.notion.pages.update({
          page_id: pageId,
          in_trash: true,
        });

        return resolve({ error: false, data: result });
      } catch (error) {
        return resolve({ error: true, message: error.message });
      }
    });
  }

  getDatabases({ databaseId, limit = 50 }: any) {
    return new Promise(async (resolve) => {
      try {
        const result = await this.notion.databases.query({
          database_id: databaseId,
          page_size: limit,
        });

        return resolve({ error: false, data: result });
      } catch (error) {
        return resolve({ error: true, message: error.message });
      }
    });
  }

  getBlocks({ pageId, limit = 50 }: any) {
    return new Promise(async (resolve) => {
      try {
        const result = await this.notion.blocks.children.list({
          block_id: pageId,
          page_size: limit,
        });

        return resolve({ error: false, data: result });
      } catch (error) {
        return resolve({ error: true, message: error.message });
      }
    });
  }
}
