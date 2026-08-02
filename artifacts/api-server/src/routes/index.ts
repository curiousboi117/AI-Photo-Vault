import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import photosRouter from "./photos";
import albumsRouter from "./albums";
import trashRouter from "./trash";
import searchRouter from "./search";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(photosRouter);
router.use(albumsRouter);
router.use(trashRouter);
router.use(searchRouter);
router.use(usersRouter);

export default router;
