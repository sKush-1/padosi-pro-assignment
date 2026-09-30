import { FastifyRequest, FastifyReply } from "fastify";
import pool from "../config/database/db.config";
import { sendResponse } from "../utils/sendresponse.util";
import { validateTaskSelection } from "../utils/validation/user.validation";

// ─── GET /tasks ───────────────────────────────────────────────────────────────
export async function listTasks(
  request: FastifyRequest<{ Querystring: { category?: string } }>,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { category } = request.query;
    const params: string[] = [];
    let query = "SELECT id, name, category, short_description, created_at FROM tasks";

    if (category && category.trim()) {
      params.push(category.trim());
      query += " WHERE category = $1";
    }

    query += " ORDER BY category, name";

    const { rows, rowCount } = await pool.query(query, params);
    return sendResponse(reply, 200, false, "Tasks fetched.", { tasks: rows, count: rowCount });
  } catch (err) {
    request.log.error(err);
    return sendResponse(reply, 500, true, "Internal server error.");
  }
}

// ─── GET /tasks/categories ────────────────────────────────────────────────────
export async function listCategories(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { rows } = await pool.query(
      "SELECT DISTINCT category FROM tasks ORDER BY category",
    );
    return sendResponse(reply, 200, false, "Categories fetched.", {
      categories: rows.map((r) => r.category),
    });
  } catch (err) {
    request.log.error(err);
    return sendResponse(reply, 500, true, "Internal server error.");
  }
}

// ─── POST /tasks/select ───────────────────────────────────────────────────────
// Atomically replaces the user's entire task selection.
export async function selectTasks(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const v = validateTaskSelection(request.body);
  if (!v.valid) return sendResponse(reply, 400, false, v.error);
  const { task_ids } = v.value;

  // Verify all supplied IDs exist in the catalogue
  const { rows: found } = await pool.query(
    "SELECT id FROM tasks WHERE id = ANY($1::uuid[])",
    [task_ids],
  );

  if (found.length !== task_ids.length) {
    const foundIds = found.map((r) => r.id as string);
    const invalid = task_ids.filter((id) => !foundIds.includes(id));
    return sendResponse(reply, 400, false, `Task IDs not found: ${invalid.join(", ")}`);
  }

  // Use a single client so BEGIN / COMMIT / ROLLBACK target the same connection
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query("DELETE FROM user_tasks WHERE user_id = $1", [request.user_id]);

    if (task_ids.length > 0) {
      const values = task_ids.map((_, i) => `($1, $${i + 2})`).join(", ");
      await client.query(
        `INSERT INTO user_tasks (user_id, task_id) VALUES ${values}`,
        [request.user_id, ...task_ids],
      );
    }

    await client.query("COMMIT");
    return sendResponse(reply, 200, false, "Task selection saved.", { selected_count: task_ids.length });
  } catch (err) {
    await client.query("ROLLBACK");
    request.log.error(err);
    return sendResponse(reply, 500, true, "Internal server error.");
  } finally {
    client.release();
  }
}

// ─── GET /tasks/my-tasks ─────────────────────────────────────────────────────
export async function getMyTasks(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const { rows, rowCount } = await pool.query(
      `SELECT t.id, t.name, t.category, t.short_description, ut.created_at AS selected_at
         FROM user_tasks ut
         JOIN tasks t ON t.id = ut.task_id
        WHERE ut.user_id = $1
        ORDER BY t.category, t.name`,
      [request.user_id],
    );
    return sendResponse(reply, 200, false, "Your selected tasks.", { tasks: rows, count: rowCount });
  } catch (err) {
    request.log.error(err);
    return sendResponse(reply, 500, true, "Internal server error.");
  }
}
