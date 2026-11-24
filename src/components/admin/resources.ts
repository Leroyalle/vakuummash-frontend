import { docKindLabels, docScopeLabels } from '@/data/labels'
import type { ResourceDef } from './ResourceAdmin'

const opts = (m: Record<string, string>) => Object.entries(m).map(([value, label]) => ({ value, label }))
const today = () => new Date().toISOString().slice(0, 10)

export const resources: Record<string, ResourceDef> = {
  news: {
    type: 'news', endpoint: 'pages', title: 'Новости', lead: 'Публикации раздела «Новости» на сайте. Первое фото станет обложкой.',
    addLabel: 'Добавить новость', savedText: 'Новость сохранена и уже на сайте', emptyTitle: 'Новостей пока нет', emptyText: 'Расскажите о событии компании, выставке или новой продукции.',
    filter: (r) => r.group === 'press', fixed: { group: 'press' },
    columns: ['title', 'date'], defaults: { slug: '', title: '', group: 'press', date: today(), html: '', images: [] },
    fields: [
      { key: 'title', label: 'Заголовок', kind: 'text', required: true, hint: 'Коротко и по делу, например: «Новая серия датчиков давления»' },
      { key: 'date', label: 'Дата публикации', kind: 'date' },
      { key: 'images', label: 'Фотографии', kind: 'images', hint: 'Первое фото используется как обложка' },
      { key: 'html', label: 'Текст новости', kind: 'html' },
    ],
  },
  vacancies: {
    type: 'vacancies', endpoint: 'pages', title: 'Вакансии', lead: 'Открытые вакансии завода.',
    addLabel: 'Добавить вакансию', savedText: 'Вакансия сохранена', emptyTitle: 'Вакансий пока нет', emptyText: 'Добавьте вакансию, и она появится в разделе «Вакансии».',
    filter: (r) => r.group === 'vacancy', fixed: { group: 'vacancy' },
    columns: ['title', 'date'], defaults: { slug: '', title: '', group: 'vacancy', date: today(), html: '', images: [] },
    fields: [
      { key: 'title', label: 'Должность', kind: 'text', required: true },
      { key: 'date', label: 'Дата публикации', kind: 'date' },
      { key: 'html', label: 'Описание вакансии', kind: 'html' },
    ],
  },
  pages: {
    type: 'pages', title: 'Страницы сайта', lead: 'Тексты постоянных страниц сайта — это не новости. «О заводе» → страница «О заводе», «Доставка» → «Доставка», «Контакты» → блок «Отделы» на странице контактов, материалы поддержки → «Поддержка».',
    addLabel: 'Добавить страницу', savedText: 'Страница сохранена', emptyTitle: 'Страниц нет', emptyText: 'Создайте страницу, чтобы она появилась на сайте.',
    filter: (r) => r.group === 'page' || r.group === 'support',
    columns: ['title', 'group'], defaults: { slug: '', title: '', group: 'page', date: today(), html: '', images: [] },
    fields: [
      { key: 'title', label: 'Заголовок', kind: 'text', required: true },
      { key: 'group', label: 'Где показывать', kind: 'select', options: [{ value: 'page', label: 'Обычная страница' }, { value: 'support', label: 'Раздел «Поддержка»' }] },
      { key: 'images', label: 'Фотографии', kind: 'images' },
      { key: 'html', label: 'Содержимое', kind: 'html' },
    ],
  },
  projects: {
    type: 'projects', title: 'Проекты', lead: 'Предприятия и объекты, где работают ваши датчики.',
    addLabel: 'Добавить проект', savedText: 'Проект сохранён', emptyTitle: 'Проектов пока нет', emptyText: 'Добавьте проект: название заказчика, логотип и короткое описание.',
    columns: ['title', 'region', 'date'], defaults: { slug: '', title: '', region: null, importSubstitution: false, date: today(), html: '', images: [] },
    fields: [
      { key: 'title', label: 'Заказчик или объект', kind: 'text', required: true },
      { key: 'region', label: 'Регион', kind: 'text', nullable: true },
      { key: 'date', label: 'Дата', kind: 'date' },
      { key: 'importSubstitution', label: 'Поставка по импортозамещению', kind: 'bool' },
      { key: 'images', label: 'Фотографии и логотип', kind: 'images', hint: 'Первое изображение показывается в списке проектов' },
      { key: 'html', label: 'Описание', kind: 'html' },
    ],
  },
  reviews: {
    type: 'reviews', title: 'Отзывы', lead: 'Благодарственные письма и отзывы клиентов.',
    addLabel: 'Добавить отзыв', savedText: 'Отзыв сохранён', emptyTitle: 'Отзывов пока нет', emptyText: 'Добавьте отзыв клиента и, если есть, скан письма.',
    columns: ['company', 'industry', 'date'], defaults: { slug: '', company: '', industry: null, date: today(), html: '', image: null },
    fields: [
      { key: 'company', label: 'Компания', kind: 'text', required: true },
      { key: 'industry', label: 'Отрасль', kind: 'text', nullable: true, hint: 'Например: нефтегазовая отрасль. По ней отзывы группируются' },
      { key: 'date', label: 'Дата', kind: 'date' },
      { key: 'image', label: 'Скан письма', kind: 'image' },
      { key: 'html', label: 'Текст отзыва', kind: 'html' },
    ],
  },
  documents: {
    type: 'documents', title: 'Документы', lead: 'Сертификаты, декларации, руководства и каталоги для скачивания.',
    addLabel: 'Добавить документ', savedText: 'Документ сохранён', emptyTitle: 'Документов пока нет', emptyText: 'Загрузите PDF-файл, и клиенты смогут его скачать.',
    columns: ['title', 'kind', 'date'], defaults: { slug: '', title: '', kind: 'certificate', scope: 'general', categorySlugs: [], date: today(), fileUrl: '', fileFormat: 'PDF', fileSizeKb: 0, preview: null },
    fields: [
      { key: 'title', label: 'Название документа', kind: 'text', required: true },
      { key: 'kind', label: 'Тип документа', kind: 'select', options: opts(docKindLabels) },
      { key: 'scope', label: 'К какой продукции относится', kind: 'select', options: opts(docScopeLabels) },
      { key: 'date', label: 'Дата документа', kind: 'date' },
      { key: 'fileUrl', label: 'Файл', kind: 'file' },
      { key: 'preview', label: 'Картинка-превью', kind: 'image', hint: 'Необязательно: скан или обложка документа' },
    ],
  },
  faq: {
    type: 'faq', title: 'Вопросы и ответы', lead: 'Показываются на сайте на странице «Поддержка» (меню «Поддержка» → блок «Частые вопросы», адрес /support#faq). Если вопросов нет, блок на сайте скрыт.',
    addLabel: 'Добавить вопрос', savedText: 'Вопрос сохранён', emptyTitle: 'Вопросов пока нет', emptyText: 'Пока здесь пусто, раздел на сайте скрыт. Добавьте первый вопрос, и он появится в поддержке.',
    columns: ['question'], defaults: { question: '', answer: '', position: 0 },
    fields: [
      { key: 'question', label: 'Вопрос', kind: 'text', required: true },
      { key: 'answer', label: 'Ответ', kind: 'textarea', required: true },
      { key: 'position', label: 'Порядок в списке', kind: 'number', hint: 'Меньшее число — выше в списке' },
    ],
  },
}
