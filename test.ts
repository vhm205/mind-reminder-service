import { Client } from '@notionhq/client';

const NOTION_SECRET = 'secret_fLFGqMtCQgKzTMRQgXsy6u5pMdPW9YlKPKBpnARhEsz';
const PAGE_ID = 'e0df498fbdf54ccbb842c98f2117e3e6';

const notion = new Client({
  auth: NOTION_SECRET,
});

(async () => {
  try {
    const page = await createPage();
    console.log({ page });

    const block = await createBlock({ blockId: page.id });
    console.log({ block });

    // const response = await notion.databases.query({
    //   database_id: 'edd0d86c-624c-4cf5-b638-7778b1cceecb',
    // });
    return;

    // const response = await notion.blocks.children.list({
    //   block_id: PAGE_ID,
    //   page_size: 50,
    // });
    // return console.log({ response });

    const newDatabase = await notion.databases.create({
      parent: {
        type: 'page_id',
        page_id: PAGE_ID,
      },
      title: [
        {
          type: 'text',
          text: {
            content: `database ${new Date()}`,
          },
        },
      ],
      properties: {
        // These properties represent columns in the database (i.e. its schema)
        Title: {
          type: 'title',
          title: {},
        },
        Docs: {
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
    console.log({ newDatabase });
  } catch (error) {
    console.log(error);
  }
})();

async function createBlock({ blockId, content }: any) {
  const newBlock = await notion.blocks.children.append({
    block_id: blockId,
    children: [
      {
        paragraph: {
          rich_text: [
            {
              text: {
                content:
                  'Lacinato kale is a variety of kale with a long tradition in Italian cuisine, especially that of Tuscany. It is also known as Tuscan kale, Italian kale, dinosaur kale, kale, flat back kale, palm tree kale, or black Tuscan palm.',
                link: {
                  url: 'https://en.wikipedia.org/wiki/Lacinato_kale',
                },
              },
            },
          ],
        },
      },
    ],
  });

  return newBlock;
}

async function createPage() {
  const newPage = await notion.pages.create({
    parent: {
      type: 'database_id',
      database_id: 'edd0d86c-624c-4cf5-b638-7778b1cceecb',
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
              content: 'Tuscan kale',
            },
          },
        ],
      },
    },
  });
  return newPage;
}
