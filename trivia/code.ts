const types = [
  { name: "multiple choice", data: "multiple" },
  { name: "true/false", data: "boolean" },
];
const difficulties = ["easy", "medium", "hard"];

const numbers = ["5", "10", "15", "20", "25", "30"];

interface Category {
  name: string;
  data: string;
}

let categories: Category[] = [];

startUI();
loadCategories();

// The 'input' event listens for text change in the Quick Actions box after a plugin is 'Tabbed' into.
figma.parameters.on("input", ({ key, query, result }: ParameterInputEvent) => {
  switch (key) {
    case "number":
      result.setSuggestions(numbers.filter((s) => s.includes(query)));
      break;
    case "category":
      result.setSuggestions(categories.filter((s) => s.name.includes(query)));
      break;
    case "difficulty":
      result.setSuggestions(difficulties.filter((s) => s.includes(query)));
      break;
    case "type":
      result.setSuggestions(types.filter((s) => s.name.includes(query)));
      break;
    default:
      return;
  }
});

// When the user presses Enter after inputting all parameters, the 'run' event is fired.
figma.on("run", ({ parameters }: RunEvent) => {
  if (parameters) {
    startPluginWithParameters(parameters);
  }
});

// Start the plugin with parameters
function startPluginWithParameters(parameters: ParameterValues) {
  const validatedParameters = validateParameters(parameters);
  if (!validatedParameters) {
    figma.notify(
      "One of the parameters was not correctly specified. Please try again."
    );
    figma.closePlugin();
  }
  const url = createAPIUrl(validatedParameters);
  figma.ui.postMessage({ type: "questions", url });

  // figma.closePlugin();
}

function loadCategories() {
  figma.ui.postMessage({ type: "category" });
}

interface TriviaParameters {
  number?: number;
  category?: number;
  difficulty?: string;
  type?: string;
}

interface TriviaResponse {
  responseCode: number;
  results: TriviaResults[];
}
interface TriviaResults {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correctAnswers: string;
  incorrectAnswers: string[];
}

function validateParameters(
  parameters: ParameterValues
): TriviaParameters | null {
  const numberString = parameters["number"];
  let number;
  if (numberString) {
    number = Number(numberString);
    if (number === NaN) {
      return null;
    }
  }

  const category = parameters["category"];
  const difficulty = parameters["difficulty"];
  const type = parameters["type"];

  return { number, category, difficulty, type };
}

function createAPIUrl(parameters: TriviaParameters): string {
  const { number, category, difficulty, type } = parameters;
  let url = "https://opentdb.com/api.php?";
  url += number ? `amount=${number}&` : `amount=10&`;
  url += category ? `category=${category}&` : "";
  url += difficulty ? `difficulty=${difficulty}&` : "";
  url += type ? `type=${type}` : "";

  return url;
}

function startUI() {
  figma.showUI(__html__, { visible: false });
  figma.ui.onmessage = async (msg) => {
    console.log(msg.type);
    if (msg.type === "category") {
      console.log(msg.response.trivia_categories);
      categories = msg.response.trivia_categories.map(
        (c: { name: string; id: number }) => ({ name: c.name, data: c.id })
      );
    } else if (msg.type === "questions") {
      console.log(msg.response);
      const response = msg.response
      const triviaResponse: TriviaResponse = {
        responseCode: response.response_code,
        results: response.results.map(r => ({
          category: r.category, 
          type: r.type,
          difficulty: r.difficulty, 
          question: r.question,
          correctAnswer: r.correct_answer, 
          incorrectAnswers: r.incorrect_answers
        }))
      }
      figma.closePlugin();
    }
  };
}