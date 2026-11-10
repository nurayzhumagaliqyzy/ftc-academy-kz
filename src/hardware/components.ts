export const sources = {
  ports: { title: 'REV Robotics · Control Hub Specifications', url: 'https://docs.revrobotics.com/duo-control/control-system-overview/control-hub-basics' },
  wiring: { title: 'FIRST · Connecting Devices to a Hub', url: 'https://ftc-docs.firstinspires.org/en/latest/hardware_and_software_configuration/connecting_devices/index.html' },
  firstPorts: { title: 'FIRST · Control Hub Ports', url: 'https://ftc-docs.firstinspires.org/en/latest/control_hard_compon/rc_components/hub/ports/ch-ports.html' },
  expansion: { title: 'FIRST · Adding an Expansion Hub', url: 'https://ftc-docs.firstinspires.org/en/latest/hardware_and_software_configuration/configuring/configuring_dual_hubs/configuring-dual-hubs.html' },
  motor: { title: 'FIRST · Connecting a Motor to the Hub', url: 'https://ftc-docs.firstinspires.org/en/latest/hardware_and_software_configuration/connecting_devices/connecting_motor/connecting-motor.html' },
  servo: { title: 'FIRST · Connecting a Servo to the Hub', url: 'https://ftc-docs.firstinspires.org/en/latest/hardware_and_software_configuration/connecting_devices/connecting_servo/connecting-servo.html' },
  i2c: { title: 'REV Robotics · I2C', url: 'https://docs.revrobotics.com/duo-control/sensors/i2c' },
  distance: { title: 'REV Robotics · 2m Distance Sensor Application Examples', url: 'https://docs.revrobotics.com/rev-crossover-products/sensors/2m-distance/application-examples' },
  color: { title: 'REV Robotics · Color Sensor V3', url: 'https://docs.revrobotics.com/rev-crossover-products/sensors/color-sensor' },
  imu: { title: 'FIRST · Universal IMU Interface', url: 'https://ftc-docs.firstinspires.org/en/latest/programming_resources/imu/imu.html' },
  drivetrain: { title: 'REV Robotics · Mecanum Wheel Setup and Behavior', url: 'https://docs.revrobotics.com/duo-build/ftc-starter-kit-mecanum-drivetrain/mecanum-wheel-setup-and-behavior' },
  driver: { title: 'FIRST · Control System Introduction', url: 'https://ftc-docs.firstinspires.org/en/latest/programming_resources/shared/control_system_intro/The-FTC-Control-System.html' },
  battery: { title: 'REV Robotics · XT-30 Power Cable', url: 'https://docs.revrobotics.com/duo-control/control-system-overview/cables-and-connectors/xt-30-power-cable' },
} as const

export type SourceId = keyof typeof sources

type HardwareItem = {
  id: string
  name: string
  gloss: string
  group: string
  description: string
  role: string
  connection: string
  example: string
  mistakes: readonly string[]
  sources: readonly SourceId[]
}

export const hardware = [
  {
    id: 'chassis', name: 'Chassis', gloss: 'шасси', group: 'Механика',
    description: 'Роботтың салмағын көтеретін қаңқа. Оған дөңгелектер, қозғалтқыштар және басқару құрылғылары бекітіледі. Қаңқаның пішіні дөңгелектердің жерге біркелкі тірелуіне әсер етеді.',
    role: 'Drivetrain (жүріс жүйесі) бөлшектерін бір-біріне қатысты дұрыс қалыпта ұстайды және механизмдерге тірек болады.',
    connection: 'Control Hub (басқару блогы) портына жалғанбайды. Қаңқаға бөлшектерді бекіткенде кабельдерге және Battery (аккумулятор) ауыстыруға орын қалдыр.',
    example: 'Қаңқаны тегіс үстелге қойып, төрт дөңгелектің бетке бірдей тиіп тұрғанын тексер. Ауыр бөлшектердің орнын өзгерткенде тепе-теңдік қалай өзгеретінін бақыла.',
    mistakes: ['Қаңқаның қиғаш жиналғанын байқамай, ақауды бағдарламадан іздеу.', 'Кабельді айналатын дөңгелекке немесе беріліске жақын өткізу.'],
    sources: ['drivetrain'],
  },
  {
    id: 'control-hub', name: 'Control Hub', gloss: 'басқару блогы', group: 'Басқару',
    description: 'Роботтың негізгі басқару құрылғысы. Ішіндегі Android жүйесінде FTC SDK (бағдарламалық әзірлеу жинағы) жұмыс істейді және OpMode (роботты басқару бағдарламасы) орындалады.',
    role: 'Бағдарлама командаларын құрылғыларға жеткізеді, өлшемдерді оқиды және Driver Station (оператор станциясы) арқылы басқаруға мүмкіндік береді.',
    connection: 'Қорек XT30 (қуат қосқышы) арқылы келеді. Motor порттары қозғалтқышты қоректендіреді, Encoder порттары айналым дерегін оқиды, Servo порттары сервоқозғалтқышты басқарады, I2C (сандық дерек алмасу шинасы) үйлесімді датчиктерге арналған.',
    example: 'Robot Configuration (робот құрылғыларының баптауы) ішінде Motor 0 құрылғысын leftDrive деп ата. Бағдарламада дәл сол атауды қолдан.',
    mistakes: ['Кабельдің пішіні ұқсас болғандықтан, порттардың қызметі де бірдей деп ойлау.', 'Robot Configuration ішінде портты немесе құрылғы түрін қате таңдау.'],
    sources: ['ports', 'driver'],
  },
  {
    id: 'expansion-hub', name: 'Expansion Hub', gloss: 'кеңейту блогы', group: 'Басқару',
    description: 'Control Hub (басқару блогы) порттары жетпегенде қосымша Motor, Encoder, Servo және Sensor (датчик) қосуға арналған блок.',
    role: 'Роботқа қосымша механизмдер мен өлшеу құрылғыларын қосуға мүмкіндік береді. Бұл сұлбада бағдарламаны Control Hub іске қосады.',
    connection: 'Control Hub-пен RS485 (дерек алмасу желісі) арқылы байланысады. Блоктар арасында қорек бөлек XT30 (қуат қосқышы) кабелімен беріледі. Екі блокты Robot Configuration (робот құрылғыларының баптауы) ішінде тексер.',
    example: 'Төрт DC Motor (тұрақты ток қозғалтқышы) Control Hub порттарын алып тұрса, көтергіштің қозғалтқышын Expansion Hub-қа жоспарла.',
    mistakes: ['RS485 кабелі арқылы қорек те беріледі деп ойлау.', 'Қосымша блокты жалғап, бұрынғы Robot Configuration файлын сол күйінде қолдану.'],
    sources: ['expansion', 'battery'],
  },
  {
    id: 'dc-motor', name: 'DC Motor', gloss: 'тұрақты ток қозғалтқышы', group: 'Қозғалыс',
    description: 'Электр энергиясын біліктің айналысына айналдырады. Бағдарлама қуат пен айналу бағытын басқарады. Айналымды өлшеу үшін Encoder (айналымды өлшейтін құрылғы) дерегі пайдаланылады.',
    role: 'Дөңгелекті, көтергішті немесе үздіксіз айналатын механизмді қозғайды.',
    connection: 'Control Hub (басқару блогы) үстіндегі Motor 0–3 портына үйлесімді кабельмен жалғанады. Портта екі түйіспелі JST VH қосқышы бар. Мотордың кіріктірілген Encoder кабелі бөлек, нөмірі сәйкес Encoder портына жалғанады.',
    example: 'Қауіпсіз бекітілген дөңгелекті төмен қуатпен сынап, команда таңбасы ауысқанда айналу бағыты қалай өзгеретінін бақыла.',
    mistakes: ['Motor кабелін Encoder портына жалғауға тырысу.', 'Айнала алмай тұрған механизмге ұзақ уақыт қуат беру.'],
    sources: ['motor', 'firstPorts'],
  },
  {
    id: 'servo-motor', name: 'Servo Motor', gloss: 'сервоқозғалтқыш', group: 'Қозғалыс',
    description: 'Позициялық Servo Motor берілген қалыпқа жетуге және оны ұстап тұруға арналған. Үздіксіз айналатын үлгілері де бар. Мұндағы мысал позициялық үлгіге арналған.',
    role: 'Қысқышты ашып-жабады немесе жеңіл иінтіректі берілген қалыпқа бұрады.',
    connection: 'Control Hub (басқару блогы) үстіндегі Servo 0–5 портына үш түйіспелі кабельмен жалғанады. Порт таңбасына және өндіруші сұлбасына қарап, Ground (ортақ 0 В түйіспесі), қорек және сигнал түйіспелерін сәйкестендір.',
    example: 'Қысқыштың ашық және жабық қалпын бөлек сына. Механикалық шектен аспайтын екі қалыпты белгіле.',
    mistakes: ['Кабельдің бағытын тексермей жалғау.', 'Механизм тірелгеннен кейін де одан әрі жылжу командасын беру.'],
    sources: ['servo', 'ports'],
  },
  {
    id: 'encoder', name: 'Encoder', gloss: 'айналымды өлшейтін құрылғы', group: 'Өлшеу',
    description: 'Білік айналғанда импульс береді. Quadrature Encoder (екі арналы айналым датчигі) арналардың ретінен айналу бағытын да анықтауға мүмкіндік береді.',
    role: 'Бағдарламаға айналым санын бағалауға көмектеседі. Дөңгелек өлшемі мен беріліс қатынасы белгілі болса, жүрген жолды шамалауға болады.',
    connection: 'Үйлесімді кабель Control Hub (басқару блогы) үстіндегі төрт түйіспелі Encoder портына жалғанады. DC Motor (тұрақты ток қозғалтқышы) ішіндегі Encoder сол Motor арнасының нөміріне сәйкес қосылады. Үйлесімді дербес Encoder де қолдануға болады.',
    example: 'Дөңгелекті қолмен бір айналдырып, есептегіш мәнінің қаншаға өзгергенін салыстыр.',
    mistakes: ['Encoder кабелі қозғалтқышқа қорек береді деп ойлау.', 'Бір айналымға шаққандағы импульс саны мен беріліс қатынасын шатастыру.'],
    sources: ['firstPorts', 'ports'],
  },
  {
    id: 'distance-sensor', name: 'Distance Sensor', gloss: 'қашықтық датчигі', group: 'Өлшеу',
    description: 'Модульдегі үлгі — REV 2m Distance Sensor. Ол Time of Flight (сигналдың барып-қайту уақытын өлшеу) әдісімен қашықтықты бағалайды. Нысан өлшемі мен жарық нәтижеге әсер етуі мүмкін.',
    role: 'Роботтың қабырғаға қаншалықты жақындағанын анықтауға көмектеседі.',
    connection: 'Control Hub (басқару блогы) үстіндегі I2C (сандық дерек алмасу шинасы) портына төрт түйіспелі үйлесімді кабельмен жалғанады. Robot Configuration (робот құрылғыларының баптауы) ішінде нақты үлгіні таңда.',
    example: 'Үлкен тегіс нысанды бірнеше белгілі қашықтыққа қойып, өлшемдерді сызғышпен алынған мәндермен салыстыр.',
    mistakes: ['2m атауы кез келген жағдайда екі метрге дейін бірдей дәл өлшейді деп қабылдау.', 'Нысан датчиктің көру аймағында тұрғанын тексермеу.'],
    sources: ['distance', 'i2c'],
  },
  {
    id: 'color-sensor', name: 'Color Sensor', gloss: 'түс датчигі', group: 'Өлшеу',
    description: 'Модульдегі үлгі — REV Color Sensor V3. Ол шағылған жарықтың RGB (қызыл, жасыл және көк) мәндерін және нысанның шамамен жақындығын өлшейді.',
    role: 'Түсті белгілерді ажыратып, бағдарламаға қандай әрекет жасау керегін анықтауға көмектеседі.',
    connection: 'Control Hub (басқару блогы) үстіндегі I2C (сандық дерек алмасу шинасы) портына жалғанады. REV 2m Distance Sensor мен REV Color Sensor V3 бірдей I2C мекенжайын қолданады. Екеуін бөлек I2C арналарына орналастыр.',
    example: 'Бірдей жарық пен арақашықтықта қызыл және көк үлгілерден бірнеше RGB өлшемін алып, оларды ажырататын шарт ұсын.',
    mistakes: ['Бір өлшемге қарап түс шегін бекіту.', 'Жарық немесе датчик пен нысан арасы өзгергенін ескермеу.'],
    sources: ['color', 'i2c'],
  },
  {
    id: 'imu', name: 'IMU', gloss: 'инерциялық өлшеу модулі', group: 'Өлшеу',
    description: 'Роботтың кеңістіктегі бағдарын бағалауға көмектесетін құрылғы. Yaw (тік ось айналасындағы бұрылу) арқылы роботтың жазықтықтағы бағытын бақылауға болады.',
    role: 'Бағытты түзетуге және бұрылу бұрышын өлшеуге көмектеседі. Роботтың алаңдағы координатасын өзі тікелей өлшемейді.',
    connection: 'Бұл сабақта Control Hub (басқару блогы) ішіне орнатылған IMU қаралады. Ол I2C (сандық дерек алмасу шинасы) 0 арнасында орналасады. Сыртқы кабель қажет емес. FTC SDK (бағдарламалық әзірлеу жинағы) ішінде Control Hub орнатылған бағытын көрсет.',
    example: 'Роботты үстел үстінде шамамен 90° бұрып, Yaw өзгерісін және оның таңбасын бақыла.',
    mistakes: ['Control Hub қаңқаға қандай бағытта орнатылғанын баптауда қате көрсету.', 'Бастапқы бағдарды тексермей, кез келген Yaw мәнін абсолют бағыт деп қабылдау.'],
    sources: ['imu', 'i2c'],
  },
  {
    id: 'mecanum-wheel', name: 'Mecanum Wheel', gloss: 'жан-жаққа қозғалуға арналған дөңгелек', group: 'Механика',
    description: 'Жиегінде қиғаш орналасқан еркін айналатын роликтері бар дөңгелек. Төртеуі дұрыс орнатылса, айналу үйлесімі роботтың бүйірге қозғалуына мүмкіндік береді.',
    role: 'Роботты алға-артқа, жанға және диагональ бойымен жылжытуға, сондай-ақ орнында бұруға көмектеседі.',
    connection: 'Drivetrain (жүріс жүйесі) білігіне бекітіледі. Сол және оң дөңгелектерді ажырат. REV үлгісін үстінен қарағанда роликтердің бағыты X пішінін құрайды.',
    example: 'Төрт дөңгелекті үстінен қарап, роликтердің қиғаш бағытын сызып белгіле. Содан кейін бүйірге қозғалысты сына.',
    mistakes: ['Сол және оң дөңгелектердің орнын ауыстыру.', 'Motor бағытын тексермей тұрып, қозғалыс формуласын өзгерту.'],
    sources: ['drivetrain'],
  },
  {
    id: 'gamepad', name: 'Gamepad', gloss: 'ойын контроллері', group: 'Басқару',
    description: 'Батырмалар мен басқару таяқшалары арқылы оператордан команда қабылдайтын құрылғы. TeleOp (оператор басқаратын режим) кезінде бағдарлама осы кірістерді оқиды.',
    role: 'Жүрісті, бұрылуды және механизмдердің әрекетін операторға басқаруға мүмкіндік береді.',
    connection: 'Бұл сұлбадағы сымды Gamepad USB арқылы Driver Hub (оператор құрылғысы) портына жалғанады. Driver Station (оператор станциясы) сигналды роботқа жібереді.',
    example: 'Басқару таяқшасын аздап, содан кейін шегіне дейін итер. Бағдарламадағы кіріс мәнінің қалай өзгеретінін бақыла.',
    mistakes: ['Gamepad кабелін роботтағы Control Hub-қа жалғауға тырысу.', 'Бағдарлама gamepad1 оқып тұрғанда операторға екінші Gamepad тағайындалғанын байқамау.'],
    sources: ['driver'],
  },
  {
    id: 'battery', name: 'Battery', gloss: 'аккумулятор', group: 'Қорек',
    description: 'Роботтың электр қуат көзі. Бұл сабақта FTC сұлбасындағы 12 В NiMH Battery (никель-металл гидридті аккумулятор) қаралады.',
    role: 'Control Hub (басқару блогы) арқылы роботтағы электр құрылғыларының жұмысын қамтамасыз етеді. Жүктеме кезінде қорек күйі қозғалысқа әсер етуі мүмкін.',
    connection: 'Нақты роботта қорек Power Switch (қуат ажыратқышы) арқылы Control Hub-тың XT30 (қуат қосқышы) кірісіне беріледі. Кабельді өзгертер алдында роботтың қуатын ажырат.',
    example: 'Дайын роботта Telemetry (жұмыс деректерін көрсету) арқылы бос жүріс пен қозғалыс кезіндегі кернеуді салыстыр.',
    mistakes: ['XT30 кабелін ажыратқанда сымның өзінен тарту.', 'Робот жүктеме кезінде өшсе, Battery мен қуат қосқышын тексермей кодты өзгерту.'],
    sources: ['wiring', 'battery'],
  },
] as const satisfies readonly HardwareItem[]

export type ComponentId = (typeof hardware)[number]['id']
