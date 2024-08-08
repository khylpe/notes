import MarkdownIt from 'markdown-it';
import markdownItMultiMdTable from 'markdown-it-multimd-table';
import markdownItFootnote from 'markdown-it-footnote';
import markdownItKatex from 'markdown-it-katex';
import markdownItDeflist from 'markdown-it-deflist';
import markdownItMark from 'markdown-it-mark';
import hljs from 'highlight.js';

const md = new MarkdownIt({
       html: true,
       linkify: true,
       typographer: true,
       breaks: true,
       highlight: function (str, lang) {
              if (lang && hljs.getLanguage(lang)) {
                     try {
                            return hljs.highlight(str, { language: lang }).value;
                     } catch (__) { /* empty */ }
              }
              return ''; // use external default escaping
       }
});

// Your other plugin configurations
md.use(markdownItMultiMdTable);
md.use(markdownItFootnote);
md.use(markdownItKatex);
md.use(markdownItDeflist);
md.use(markdownItMark);

export default md;
