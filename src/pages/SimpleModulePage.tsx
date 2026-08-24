import { Bell, ChartNoAxesCombined, CreditCard, FileSpreadsheet, Landmark, PiggyBank, Users, WalletCards } from "lucide-react";
import { Link } from "react-router-dom"; import { EmptyState, PageHeader } from "../components/Ui";
const modules={
 "cards":["Cartões","Centralize limites e vencimentos dos cartões da família.",CreditCard,"Nenhum cartão cadastrado","Cadastre um cartão para associá-lo aos lançamentos."],
 "fixed-expenses":["Gastos fixos","Acompanhe compromissos que se repetem todos os meses.",Landmark,"Nenhum gasto fixo","Cadastre aluguel, assinaturas e outras recorrências."],
 "bills":["Contas a pagar","Não deixe nenhum vencimento passar.",WalletCards,"Tudo em dia","Suas próximas contas e boletos aparecerão aqui."],
 "caixinhas":["Caixinhas","Transforme planos em reservas reais.",PiggyBank,"Crie sua primeira caixinha","Defina um objetivo e acompanhe cada aporte."],
 "caixinha-detail":["Detalhe da caixinha","Aportes, retiradas e progresso da meta.",PiggyBank,"Nenhum movimento","Registre um aporte para começar sua reserva."],
 "reports":["Relatórios","Entenda seus hábitos e sua evolução financeira.",ChartNoAxesCombined,"Dados insuficientes","Os relatórios serão montados a partir dos seus lançamentos."],
 "members":["Membros","Compartilhe o grupo com controle de permissão.",Users,"Somente você por enquanto","Convide alguém da família quando desejar."],
 "notifications":["Notificações","Alertas importantes em um só lugar.",Bell,"Nenhuma notificação","Você será avisado sobre vencimentos, metas e convites."],
 "import":["Importar planilha","Traga seu histórico financeiro para o StepFin.",FileSpreadsheet,"Nenhum arquivo importado","Envie uma planilha para iniciar o processamento."]
} as const;
export function SimpleModulePage({module}:{module:keyof typeof modules}){const [title,description,Icon,empty,text]=modules[module];return <><PageHeader eyebrow="StepFin" title={title} description={description} action={module==="import"?undefined:<button className="button primary">+ Adicionar</button>}/><div className="panel"><EmptyState icon={<Icon/>} title={empty} text={text} action={module==="import"?<Link className="button primary" to="/import-spreadsheet">Selecionar arquivo</Link>:undefined}/></div></>;}
