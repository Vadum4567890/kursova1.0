import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import GavelIcon from '@mui/icons-material/Gavel';
import SecurityIcon from '@mui/icons-material/Security';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PaymentIcon from '@mui/icons-material/Payment';
import WarningIcon from '@mui/icons-material/Warning';
import { ExpandableSection } from '../components/info/ExpandableSection';
import { PenaltiesTable } from '../components/info/PenaltiesTable';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(1.5),
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
    : 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.01) 100%)',
  border: `1px solid ${theme.palette.divider}`,
}));

const HeaderBox = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(4),
  textAlign: 'center',
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: `2px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(3),
  '& .MuiTab-root': {
    textTransform: 'none',
    fontSize: '1rem',
    fontWeight: 500,
    minHeight: 56,
  },
}));

const penaltiesData = [
  {
    violation: 'Втрата номерного знаку',
    description: 'Застосовується при втраті або пошкодженні державних номерів',
    amount: '3 500 - 6 000 грн',
    category: 'документи' as const,
  },
  {
    violation: 'Втрата ключа запалення',
    description: 'Застосовується при втраті оригінального ключа з чіпом',
    amount: '4 500 - 16 000 грн',
    category: 'документи' as const,
  },
  {
    violation: 'Втрата адаптера для електромобілів',
    description: 'Застосовується при втраті зарядного адаптера',
    amount: '81 000 грн',
    category: 'документи' as const,
  },
  {
    violation: 'Пошкодження лобового скла',
    description: 'Тріщини, сколи або повне руйнування',
    amount: '5 500 - 26 000 грн',
    category: 'кузов' as const,
  },
  {
    violation: 'Подряпина бамперу',
    description: 'Подряпини або зчіси на бампері без вм\'ятин',
    amount: '11 000 грн',
    category: 'кузов' as const,
  },
  {
    violation: 'Подряпина капоту/багажника',
    description: 'Подряпини на капоті або багажнику',
    amount: '14 000 грн',
    category: 'кузов' as const,
  },
  {
    violation: 'Вм\'ятина/тріщина',
    description: 'Вм\'ятини або тріщини на кузові',
    amount: 'вартість подряпини + 6 000 грн',
    category: 'кузов' as const,
  },
  {
    violation: 'Пошкодження обшивки салону',
    description: 'Порізи, плями, опіки оббивки сидінь',
    amount: '5 500 - 21 000 грн',
    category: 'кузов' as const,
  },
  {
    violation: 'Хімчистка салону',
    description: 'При значному забрудненні салону',
    amount: '3 500 - 16 000 грн',
    category: 'кузов' as const,
  },
  {
    violation: 'Пошкодження шини R13',
    description: 'Порізи, шишки або інші пошкодження',
    amount: '1 900 грн',
    category: 'шини' as const,
  },
  {
    violation: 'Пошкодження шини R14',
    description: 'Порізи, шишки або інші пошкодження',
    amount: '2 300 грн',
    category: 'шини' as const,
  },
  {
    violation: 'Пошкодження шини R15',
    description: 'Порізи, шишки або інші пошкодження',
    amount: '2 800 грн',
    category: 'шини' as const,
  },
  {
    violation: 'Пошкодження шини R16',
    description: 'Порізи, шишки або інші пошкодження',
    amount: '3 000 грн',
    category: 'шини' as const,
  },
  {
    violation: 'Пошкодження шини R17-22',
    description: 'Порізи, шишки або інші пошкодження',
    amount: '3 500 - 13 000 грн',
    category: 'шини' as const,
  },
  {
    violation: 'Пошкодження металевого диска',
    description: 'Пошкодження металевого колісного диска',
    amount: '2 000 грн',
    category: 'шини' as const,
  },
  {
    violation: 'Пошкодження легкосплавного диска',
    description: 'Пошкодження легкосплавного диска',
    amount: '4 500 - 11 000 грн',
    category: 'шини' as const,
  },
  {
    violation: 'Керування у стані сп\'яніння',
    description: 'Керування у стані алкогольного/наркотичного сп\'яніння',
    amount: '30 000 грн',
    category: 'серйозне' as const,
  },
  {
    violation: 'Передача керування третій особі',
    description: 'Передача керування неавторизованій особі',
    amount: '30 000 грн',
    category: 'серйозне' as const,
  },
  {
    violation: 'Використання в перегонах/змаганнях',
    description: 'Участь у перегонах, ралі, змаганнях',
    amount: '30 000 грн',
    category: 'серйозне' as const,
  },
  {
    violation: 'Керування без посвідчення',
    description: 'Керування без дійсного посвідчення водія',
    amount: '30 000 грн',
    category: 'серйозне' as const,
  },
  {
    violation: 'Виїзд на заборонені території',
    description: 'Виїзд за межі України, в зони бойових дій',
    amount: '100 000 грн',
    category: 'серйозне' as const,
  },
  {
    violation: 'Куріння в салоні',
    description: 'Виявлення запаху тютюну або слідів куріння',
    amount: '5 000 грн',
    category: 'інше' as const,
  },
  {
    violation: 'Систематичне порушення швидкості',
    description: 'Перевищення 80 км/год в населених пунктах',
    amount: '4 000 грн за випадок',
    category: 'інше' as const,
  },
  {
    violation: 'Заправка неналежним паливом',
    description: 'Використання неправильного типу палива',
    amount: '20 000 грн',
    category: 'інше' as const,
  },
  {
    violation: 'Повернення без палива',
    description: 'Повернення Автомобіля з недостатнім рівнем палива',
    amount: '1 000 - 3 000 грн',
    category: 'інше' as const,
  },
];

export default function TermsAndRulesPage() {
  const [tabValue, setTabValue] = useState(0);
  const [openFullText, setOpenFullText] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const termsData = [
    {
      title: 'Визначення термінів',
      icon: <GavelIcon sx={{ fontSize: 28 }} />,
      subsections: [
        {
          title: 'Користувач',
          content: 'Загальний термін, що охоплює Наймача та Наймодавця, які взаємодіють із Посередником через Мобільний застосунок або Вебсайт для отримання або надання послуг із прокату автомобілів.',
        },
        {
          title: 'Прокат Автомобіля',
          content: 'Послуга тимчасового (короткострокового) користування транспортним засобом, яка включає надання автомобіля у користування, сплату обов\'язкових податків. Послуга надається на строк не більше 30 календарних днів.',
        },
        {
          title: 'Автомобіль',
          content: 'Транспортний засіб, що належить на праві власності Наймодавцю, має відповідні реєстраційні документи, перебуває у справному технічному стані, відповідає вимогам безпеки дорожнього руху та екологічним нормам.',
        },
        {
          title: 'Посередник',
          content: 'Товариство з обмеженою відповідальністю «Енікар», юридична особа, яка діє як посередник на підставі публічної оферти, розміщеної у Мобільному застосунку та/або на Вебсайті.',
        },
      ],
    },
    {
      title: 'Права та обов\'язки Наймача',
      icon: <DirectionsCarIcon sx={{ fontSize: 28 }} />,
      subsections: [
        {
          title: 'Основні обов\'язки',
          content: `• Зберігати в таємниці одноразовий пароль та інші дані доступу
• Надати повні, дійсні та достовірні дані під час реєстрації
• Відповідати всім вимогам до Наймача (вік 18+, дійсне посвідчення, стаж 2+ років)
• Використовувати Автомобіль відповідно до Договору та законодавства
• Керувати Автомобілем особисто (передача третім особам заборонена)
• Дотримуватися Правил дорожнього руху України
• Своєчасно вносити платежі`,
        },
        {
          title: 'Обов\'язки при ДТП та пошкодженнях',
          content: `• Негайно зупинити Автомобіль та увімкнути аварійну сигналізацію
• Встановити знак аварійної зупинки
• Зателефонувати до Служби підтримки з місця події
• Зафіксувати дані інших учасників ДТП
• Зробити фотографії місця ДТП (щонайменше 4 ракурси)
• Оформити подію за участю поліції
• Передати всі документи Посереднику не пізніше наступного дня`,
        },
        {
          title: 'Заборони для Наймача',
          content: `• Вносити поліпшення чи погіршення в Автомобіль без погодження
• Розпоряджатися Автомобілем (передавати, продавати, закладати)
• Втручатися в роботу GPS-обладнання
• Перевищувати щоденний ліміт пробігу (350 км)
• Виїжджати за межі України
• Виїжджати на території активних бойових дій
• Керувати у стані алкогольного/наркотичного сп\'яніння
• Використовувати Автомобіль в комерційних цілях без погодження`,
        },
        {
          title: 'Права Наймача',
          content: `• Вимагати від Посередника та Наймодавця виконання їхніх зобов\'язань
• Користуватися Сервісом і Автомобілем у прокаті відповідно до умов Договору
• Поповнювати рівень палива дозволеної марки власним коштом
• Оплатити Додаткові послуги, що зменшують відповідальність за ДТП`,
        },
      ],
    },
    {
      title: 'Порядок розрахунків',
      icon: <PaymentIcon sx={{ fontSize: 28 }} />,
      subsections: [
        {
          title: 'Способи оплати',
          content: `Оплата здійснюється шляхом безакцептного списання грошових коштів із банківської картки, прив\'язаної до Мобільного застосунку або Вебсайту. Посередник утримує комісію за організацію прокату та перераховує решту коштів Наймодавцю.`,
        },
        {
          title: 'Комісія Посередника',
          content: `• Базовий тариф: 5% від вартості за Прокат Автомобіля
• Стандартний тариф: 10% від вартості за Прокат Автомобіля
• Преміум тариф: 15% від вартості за Прокат Автомобіля`,
        },
        {
          title: 'Перерахування коштів Наймодавцю',
          content: `• Кошти перераховуються протягом 5 робочих днів після завершення періоду Прокату
• Перерахування здійснюється на банківський рахунок, зазначений Наймодавцем
• При достроковому поверненні сума коригується пропорційно використаним дням
• Комісія Посередника не повертається`,
        },
        {
          title: 'Додаткові витрати Наймача',
          content: `• Вартість паркування (не включена у Тариф)
• Витрати на евакуацію Автомобіля
• Штрафи за порушення ПДР
• Оплата платних доріг, мостів, тунелів
• Заправка паливом або зарядка електроенергією
• Інші витрати, не покриті Тарифом`,
        },
        {
          title: 'Дострокове повернення',
          content: `• Наймач має право повернути Автомобіль до закінчення оплаченого періоду
• Повідомити Посередника не пізніше ніж за 3 дні до планованого повернення
• Повернення коштів за невикористані дні здійснюється протягом 7 робочих днів
• Комісія Посередника не повертається`,
        },
      ],
    },
    {
      title: 'Покриття збитків',
      icon: <SecurityIcon sx={{ fontSize: 28 }} />,
      subsections: [
        {
          title: 'Базовий тариф',
          content: `• Базовий доступ до Мобільного застосунку
• Цілодобова підтримка з боку Посередника
• Компенсація збитків здійснюється безпосередньо Наймачем Наймодавцю`,
        },
        {
          title: 'Стандартний тариф',
          content: `• Часткове покриття зовнішнього миття (за умови середнього рівня забруднення)
• Покриття пошкоджень кузова/салону Автомобіля - до 25 000 грн за один випадок
• Не покриває штрафи, втрати та компенсації, визначені окремо`,
        },
        {
          title: 'Преміум тариф',
          content: `• Повне покриття чистки/миття Автомобіля після повернення
• Відсутнє обмеження по щоденному ліміту пробігу (350 км)
• Покриття страхової франшизи
• Покриття пошкоджень кузова/салону - до 50 000 грн за один випадок
• Не покриває штрафи, втрати та компенсації, визначені окремо`,
        },
        {
          title: 'Випадки, коли компенсація не надається',
          content: `• Керування у стані алкогольного/наркотичного сп\'яніння
• Передача Автомобіля третій особі без погодження
• Неналежна експлуатація Автомобіля
• Збитки повністю покриваються страховим полісом
• Наймодавець не надав документального підтвердження
• Наймач самостійно сплатив пошкодження без залучення Посередника`,
        },
        {
          title: 'Порядок компенсації',
          content: `1. Звернення подається не пізніше 24 годин від виявлення збитків
2. Посередник розглядає заяву протягом 5 робочих днів
3. За потреби залучаються незалежні експерти
4. Рішення приймається протягом 10 робочих днів
5. Компенсація перераховується протягом 20 робочих днів
6. Наймач має право оскаржити рішення протягом 5 робочих днів`,
        },
      ],
    },
    {
      title: 'Штрафи та санкції',
      icon: <WarningIcon sx={{ fontSize: 28 }} />,
      content: <PenaltiesTable penalties={penaltiesData} />,
    },
    {
      title: 'Персональні дані',
      icon: <SecurityIcon sx={{ fontSize: 28 }} />,
      subsections: [
        {
          title: 'Збір та обробка даних',
          content: `Користувач надає згоду на обробку Посередником персональних даних:
• ПІБ, дата, місяць і рік народження
• Місце народження
• Серія і номер документа, що засвідчує особу
• Адреса реєстрації та проживання
• Дані водійського посвідчення
• Контактні дані (номер телефону, email)
• Біометричні дані (фотографії)
• Дані про місце роботи та посаду`,
        },
        {
          title: 'Цілі обробки',
          content: `• Укладання та виконання Договору
• Надання додаткових послуг
• Участь в акціях, опитуваннях, дослідженнях
• Прийняття рішень, що породжують юридичні наслідки
• Розуміння інформації про надавані послуги`,
        },
        {
          title: 'Способи обробки',
          content: `• Збір, запис (включаючи електронні носії)
• Систематизація, накопичення, зберігання
• Складання переліків, маркування
• Уточнення (оновлення, зміна)
• Витяг, використання, передача
• Знеособлення, блокування, видалення, знищення
• Транскордонна передача персональних даних
• Отримання зображення шляхом фотографування`,
        },
        {
          title: 'Права користувача',
          content: `• Користувач може відкликати згоду на обробку персональних даних
• Повідомлення про відкликання подається не менш ніж за 90 днів
• Після відкликання доступ до Сервісу не буде надаватися
• Користувач має право вимагати видалення своїх персональних даних
• Після припинення Договору дані зберігаються протягом строку, необхідного для дотримання правових зобов\'язань`,
        },
        {
          title: 'Передача третім особам',
          content: `• Посередник має право передавати персональні дані третім особам для досягнення цілей Договору
• Передача здійснюється з дотриманням вимог законодавства України
• Користувач дає згоду на передачу даних уповноважених державних органів
• Посередник має право передавати дані організаціям, що здійснюють стягнення заборгованості`,
        },
      ],
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', pb: 4 }}>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <HeaderBox>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Публічний договір оферти
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
            Послуги з прокату автомобілів
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 1 }}>
            ТОВ CarRental | м.Львів
          </Typography>
        </HeaderBox>

        <Alert severity="info" sx={{ mb: 3 }}>
          Ознайомтеся з умовами договору перед використанням послуг. Прийняття умов здійснюється автоматично при реєстрації та першому використанні сервісу.
        </Alert>

        <StyledPaper>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Розділи договору
            </Typography>
            <Button
              startIcon={<FileDownloadIcon />}
              variant="outlined"
              onClick={() => setOpenFullText(true)}
            >
              Повний текст
            </Button>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <StyledTabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="terms tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            {termsData.map((section, index) => (
              <Tab
                key={index}
                label={section.title}
                id={`tab-${index}`}
                aria-controls={`tabpanel-${index}`}
              />
            ))}
          </StyledTabs>

          {termsData.map((section, index) => (
            <TabPanel key={index} value={tabValue} index={index}>
              {section.content ? (
                section.content
              ) : (
                <ExpandableSection
                  title={section.title}
                  icon={section.icon}
                  subsections={section.subsections}
                  defaultExpanded={true}
                />
              )}
            </TabPanel>
          ))}
        </StyledPaper>

        <StyledPaper sx={{ backgroundColor: 'info.lighter', border: '1px solid', borderColor: 'info.light' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            ❓ Часті запитання
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Як розпочати користування сервісом?
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                Зареєструйтеся в мобільному застосунку, завантажте необхідні документи, прив'яжіть банківську картку та отримайте доступ до послуг.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Що робити при ДТП?
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                Негайно зупиніться, увімкніть аварійну сигналізацію, зателефонуйте до Служби підтримки та оформіть подію з поліцією.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Як повернути кошти при достроковому поверненні?
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                Повідомте Посередника за 3 дні, повертаються кошти за невикористані дні (комісія не повертається) протягом 7 робочих днів.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Які штрафи за порушення?
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                Штрафи залежать від типу порушення: від 1 000 грн за незначні до 100 000 грн за серйозні порушення.
              </Typography>
            </Box>
          </Box>
        </StyledPaper>
      </Container>

      <Dialog
        open={openFullText}
        onClose={() => setOpenFullText(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Повний текст договору</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
            {`ПУБЛІЧНИЙ ДОГОВІР ОФЕРТИ
на надання посередницьких послуг з прокату автомобілів

Цей Публічний договір оферти (надалі – "Договір") укладається між Товариством з обмеженою відповідальністю "Енікар" (надалі – "Посередник"), фізичними особами Наймачами та фізичними особами-підприємцями та/або юридичними особами Наймодавцями (надалі разом – "Сторони").

[Повний текст договору...]`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFullText(false)}>Закрити</Button>
          <Button variant="contained" startIcon={<FileDownloadIcon />}>
            Завантажити PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
