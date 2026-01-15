import { useState } from "react";
import { Delete } from "lucide-react";

export function CalculatorApp() {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const toggleSign = () => {
    setDisplay(display.charAt(0) === "-" ? display.slice(1) : "-" + display);
  };

  const percentage = () => {
    setDisplay(String(parseFloat(display) / 100));
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operator) {
      const result = calculate(previousValue, inputValue, operator);
      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const equals = () => {
    if (previousValue === null || operator === null) return;

    const inputValue = parseFloat(display);
    const result = calculate(previousValue, inputValue, operator);
    
    setDisplay(String(result));
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const Button = ({ 
    onClick, 
    children, 
    className = "",
    testId
  }: { 
    onClick: () => void; 
    children: React.ReactNode; 
    className?: string;
    testId?: string;
  }) => (
    <button
      onClick={onClick}
      className={`h-14 rounded-xl text-xl font-medium transition-all active:scale-95 ${className}`}
      data-testid={testId}
    >
      {children}
    </button>
  );

  return (
    <div className="h-full flex flex-col p-4 bg-gray-900">
      {/* Display */}
      <div className="flex-1 flex flex-col justify-end items-end p-4 mb-4">
        {previousValue !== null && operator && (
          <div className="text-sm text-gray-500 mb-1">
            {previousValue} {operator}
          </div>
        )}
        <div 
          className="text-5xl font-light text-white truncate max-w-full"
          data-testid="calculator-display"
        >
          {display}
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-2">
        <Button onClick={clear} className="bg-gray-600 hover:bg-gray-500 text-white" testId="calc-clear">
          AC
        </Button>
        <Button onClick={toggleSign} className="bg-gray-600 hover:bg-gray-500 text-white" testId="calc-sign">
          +/-
        </Button>
        <Button onClick={percentage} className="bg-gray-600 hover:bg-gray-500 text-white" testId="calc-percent">
          %
        </Button>
        <Button onClick={() => performOperation("÷")} className={`${operator === "÷" ? "bg-white text-orange-500" : "bg-orange-500 hover:bg-orange-400 text-white"}`} testId="calc-divide">
          ÷
        </Button>

        <Button onClick={() => inputDigit("7")} className="bg-gray-700 hover:bg-gray-600 text-white" testId="calc-7">
          7
        </Button>
        <Button onClick={() => inputDigit("8")} className="bg-gray-700 hover:bg-gray-600 text-white" testId="calc-8">
          8
        </Button>
        <Button onClick={() => inputDigit("9")} className="bg-gray-700 hover:bg-gray-600 text-white" testId="calc-9">
          9
        </Button>
        <Button onClick={() => performOperation("×")} className={`${operator === "×" ? "bg-white text-orange-500" : "bg-orange-500 hover:bg-orange-400 text-white"}`} testId="calc-multiply">
          ×
        </Button>

        <Button onClick={() => inputDigit("4")} className="bg-gray-700 hover:bg-gray-600 text-white" testId="calc-4">
          4
        </Button>
        <Button onClick={() => inputDigit("5")} className="bg-gray-700 hover:bg-gray-600 text-white" testId="calc-5">
          5
        </Button>
        <Button onClick={() => inputDigit("6")} className="bg-gray-700 hover:bg-gray-600 text-white" testId="calc-6">
          6
        </Button>
        <Button onClick={() => performOperation("-")} className={`${operator === "-" ? "bg-white text-orange-500" : "bg-orange-500 hover:bg-orange-400 text-white"}`} testId="calc-subtract">
          −
        </Button>

        <Button onClick={() => inputDigit("1")} className="bg-gray-700 hover:bg-gray-600 text-white" testId="calc-1">
          1
        </Button>
        <Button onClick={() => inputDigit("2")} className="bg-gray-700 hover:bg-gray-600 text-white" testId="calc-2">
          2
        </Button>
        <Button onClick={() => inputDigit("3")} className="bg-gray-700 hover:bg-gray-600 text-white" testId="calc-3">
          3
        </Button>
        <Button onClick={() => performOperation("+")} className={`${operator === "+" ? "bg-white text-orange-500" : "bg-orange-500 hover:bg-orange-400 text-white"}`} testId="calc-add">
          +
        </Button>

        <Button onClick={() => inputDigit("0")} className="col-span-2 bg-gray-700 hover:bg-gray-600 text-white" testId="calc-0">
          0
        </Button>
        <Button onClick={inputDecimal} className="bg-gray-700 hover:bg-gray-600 text-white" testId="calc-decimal">
          .
        </Button>
        <Button onClick={equals} className="bg-orange-500 hover:bg-orange-400 text-white" testId="calc-equals">
          =
        </Button>
      </div>
    </div>
  );
}
