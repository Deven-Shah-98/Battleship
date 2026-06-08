import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BoardGrid from "./BoardGrid";
import { createEmptyBoard, placeShip, receiveAttack } from "../game/board";
import type { Board } from "../game/types";

describe("BoardGrid", () => {
  function emptyBoard(): Board {
    return createEmptyBoard();
  }

  function boardWithShip(): Board {
    return placeShip(emptyBoard(), { name: "Destroyer", size: 2 }, { row: 0, col: 0 }, "horizontal");
  }

  it("renders a 10x10 grid of buttons", () => {
    render(<BoardGrid board={emptyBoard()} mode="own" showShips={false} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(100);
  });

  it("renders column labels A-J", () => {
    render(<BoardGrid board={emptyBoard()} mode="tracking" showShips={false} />);
    for (const label of "ABCDEFGHIJ".split("")) {
      expect(screen.getByText(label)).toBeDefined();
    }
  });

  it("renders row labels 1-10", () => {
    render(<BoardGrid board={emptyBoard()} mode="own" showShips={false} />);
    for (let i = 1; i <= 10; i++) {
      expect(screen.getByText(String(i))).toBeDefined();
    }
  });

  it("applies board--own class for own mode", () => {
    const { container } = render(
      <BoardGrid board={emptyBoard()} mode="own" showShips={false} />,
    );
    const boardEl = container.querySelector(".board");
    expect(boardEl?.classList.contains("board--own")).toBe(true);
  });

  it("applies board--tracking class for tracking mode", () => {
    const { container } = render(
      <BoardGrid board={emptyBoard()} mode="tracking" showShips={false} />,
    );
    const boardEl = container.querySelector(".board");
    expect(boardEl?.classList.contains("board--tracking")).toBe(true);
  });

  it("calls onCellClick with the correct coordinate", () => {
    const onClick = vi.fn();
    render(
      <BoardGrid board={emptyBoard()} mode="tracking" showShips={false} onCellClick={onClick} />,
    );
    // Click cell A1 (row 0, col 0)
    const a1 = screen.getByLabelText("A1");
    fireEvent.click(a1);
    expect(onClick).toHaveBeenCalledWith({ row: 0, col: 0 });
  });

  it("calls onCellClick with correct coordinate for E5", () => {
    const onClick = vi.fn();
    render(
      <BoardGrid board={emptyBoard()} mode="tracking" showShips={false} onCellClick={onClick} />,
    );
    const e5 = screen.getByLabelText("E5");
    fireEvent.click(e5);
    expect(onClick).toHaveBeenCalledWith({ row: 4, col: 4 });
  });

  it("disables all buttons when disabled prop is true", () => {
    render(
      <BoardGrid board={emptyBoard()} mode="tracking" showShips={false} disabled />,
    );
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it("disables already-fired cells in tracking mode", () => {
    const board = receiveAttack(boardWithShip(), { row: 5, col: 5 }).board;
    render(<BoardGrid board={board} mode="tracking" showShips={false} />);
    const firedCell = screen.getByLabelText("F6"); // col 5 = F, row 5 = 6
    expect((firedCell as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows hit marker (✶) on hit cells", () => {
    const board = receiveAttack(boardWithShip(), { row: 0, col: 0 }).board;
    render(<BoardGrid board={board} mode="tracking" showShips={false} />);
    const a1 = screen.getByLabelText("A1");
    expect(a1.textContent).toBe("✶");
  });

  it("shows miss marker (•) on missed cells", () => {
    const board = receiveAttack(boardWithShip(), { row: 5, col: 5 }).board;
    render(<BoardGrid board={board} mode="tracking" showShips={false} />);
    const f6 = screen.getByLabelText("F6");
    expect(f6.textContent).toBe("•");
  });

  it("applies cell--ship class when showShips is true and cell has a ship", () => {
    const board = boardWithShip();
    const { container } = render(
      <BoardGrid board={board} mode="own" showShips={true} />,
    );
    const a1 = container.querySelector('[aria-label="A1"]');
    expect(a1?.classList.contains("cell--ship")).toBe(true);
  });

  it("does not apply cell--ship class when showShips is false", () => {
    const board = boardWithShip();
    const { container } = render(
      <BoardGrid board={board} mode="own" showShips={false} />,
    );
    const a1 = container.querySelector('[aria-label="A1"]');
    expect(a1?.classList.contains("cell--ship")).toBe(false);
  });

  it("applies cell--preview class for preview cells", () => {
    const previewCells = [{ row: 3, col: 3 }, { row: 3, col: 4 }];
    const { container } = render(
      <BoardGrid
        board={emptyBoard()}
        mode="own"
        showShips={false}
        previewCells={previewCells}
        previewValid={true}
      />,
    );
    const d4 = container.querySelector('[aria-label="D4"]');
    expect(d4?.classList.contains("cell--preview")).toBe(true);
  });

  it("applies cell--preview-invalid class for invalid preview", () => {
    const previewCells = [{ row: 3, col: 3 }];
    const { container } = render(
      <BoardGrid
        board={emptyBoard()}
        mode="own"
        showShips={false}
        previewCells={previewCells}
        previewValid={false}
      />,
    );
    const d4 = container.querySelector('[aria-label="D4"]');
    expect(d4?.classList.contains("cell--preview-invalid")).toBe(true);
  });

  it("applies cell--last class to the last shot", () => {
    const board = receiveAttack(boardWithShip(), { row: 5, col: 5 }).board;
    const { container } = render(
      <BoardGrid board={board} mode="tracking" showShips={false} lastShot={{ row: 5, col: 5 }} />,
    );
    const f6 = container.querySelector('[aria-label="F6"]');
    expect(f6?.classList.contains("cell--last")).toBe(true);
  });

  it("calls onCellHover on mouse enter", () => {
    const onHover = vi.fn();
    render(
      <BoardGrid board={emptyBoard()} mode="tracking" showShips={false} onCellHover={onHover} />,
    );
    const a1 = screen.getByLabelText("A1");
    fireEvent.mouseEnter(a1);
    expect(onHover).toHaveBeenCalledWith({ row: 0, col: 0 });
  });

  it("calls onCellHover(null) on mouse leave from board", () => {
    const onHover = vi.fn();
    const { container } = render(
      <BoardGrid board={emptyBoard()} mode="tracking" showShips={false} onCellHover={onHover} />,
    );
    const boardEl = container.querySelector(".board")!;
    fireEvent.mouseLeave(boardEl);
    expect(onHover).toHaveBeenCalledWith(null);
  });
});
