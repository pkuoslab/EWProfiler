package com.sei.agent;

import com.sei.bean.Collection.Graph.FragmentNode;
import com.sei.bean.Collection.Graph.GraphAdjustor;
import com.sei.bean.Collection.Stack.FragmentStack;
import com.sei.bean.Collection.Stack.RuntimeFragmentNode;
import com.sei.bean.View.Action;
import com.sei.bean.View.ViewTree;
import com.sei.server.component.Decision;
import com.sei.server.component.Scheduler;
import com.sei.util.ClientUtil;
import com.sei.util.CommonUtil;
import com.sei.util.ConnectUtil;
import com.sei.util.ShellUtils2;
import com.sei.util.client.ClientAdaptor;
import com.sei.util.client.ClientAutomator;

import java.util.ArrayList;
import java.util.List;

public class Device extends Thread{
    public String ip;
    public int port;
    public String serial;
    public String password;
    public String current_pkg;
    public FragmentStack fragmentStack;

    public ViewTree currentTree;
    public ViewTree newTree;
    public int screenWidth;
    public int screenHeight;
    Scheduler scheduler;
    public GraphAdjustor graphAdjustor;
    public volatile Boolean Exit;
    public List<String> visits;

    public int mode;

    private List<String> route_list;
    Boolean LOGIN_SUCCESS;

    public interface UI{
        int NEW = 0;
        int PIDCHANGE = -1;
        int OUT = -3;
        int SAME = 2;
    }

    public interface MODE{
        int REPLAY = 0;
        int DFS = 1;
        int DFSGraph = 2;
    }

    public static void main(String[] argv){
        System.out.println(Integer.parseInt("1280 abc"));
    }

    public Device(String ip, int port, String serial, String pkg, String password, int mode){
        this.ip = ip;
        this.serial = serial;
        this.current_pkg = pkg;
        this.port = port;
        this.password = password;
        this.mode = mode;
        this.visits = new ArrayList<>();
        LOGIN_SUCCESS = true;
        Exit = false;
        try {
            if (ClientAdaptor.type == ClientAdaptor.TYPE.UIAUTOMATOR)
                ClientAutomator.init(this);
        }catch (Exception e){
            e.printStackTrace();
        }

        CommonUtil.setScreenSize(this);
    }



    public void bind(Scheduler scheduler, GraphAdjustor graphAdjustor){
        this.scheduler = scheduler;
        this.graphAdjustor = graphAdjustor;
    }

    public void bind(Scheduler scheduler, GraphAdjustor graphAdjustor, FragmentStack fragmentStack){
        this.bind(scheduler, graphAdjustor);
        this.fragmentStack = fragmentStack;
    }

    @Override
    public void run(){
        int response = UI.SAME;

        try {
            initiate();
            Decision decision = null;

            if (mode != MODE.REPLAY) {
                if (fragmentStack == null) {
                    fragmentStack = new FragmentStack();
                    RuntimeFragmentNode rfn = new RuntimeFragmentNode(currentTree);
                    fragmentStack.add(rfn);
                } else {
                    Action action = null;
                    decision = new Decision(Decision.CODE.GO, action);
                    response = recover_stack(decision);
                }
            }

            if (decision == null) {
                Action action = null;
                decision = new Decision(Decision.CODE.CONTINUE, action);
                decision = scheduler.update(serial, currentTree, currentTree, decision, UI.NEW);
                response = execute_decision(decision);
                if (mode == MODE.DFSGraph)
                    ConnectUtil.sendHttpGet("http://localhost:9293/afterClick");
            }

            while(Exit == false){
                decision = scheduler.update(serial, currentTree, newTree, decision, response);
                currentTree = newTree;
                response = execute_decision(decision);
                if (mode == MODE.DFSGraph)
                    ConnectUtil.sendHttpGet("http://localhost:9293/afterClick");
            }

            scheduler.update(serial, currentTree, newTree, decision, response);
        }catch (Exception e){
            e.printStackTrace();
        }
    }

    public ViewTree getCurrentTree() throws Exception{
        return ClientAdaptor.getCurrentTree(this);
    }

    private void initiate() throws Exception{
        if (mode == MODE.DFSGraph){
            ClientAdaptor.stopApp(this, ConnectUtil.launch_pkg);
        }
        ClientAdaptor.startApp(this, ConnectUtil.launch_pkg);
        if (ClientAdaptor.checkPermission(this)) enter();
        currentTree = getCurrentTree();
        if (currentTree == null || currentTree.root == null) enter();

        if (checkLogin(currentTree)) currentTree = getCurrentTree();
    }


    public int execute_decision(Decision decision) throws Exception{
        int response = UI.OUT;
        if (decision.code == Decision.CODE.CONTINUE) {
            Action action = decision.action;
            if (action.getAction() == Action.action_list.ENTERTEXT) {

                response = ClientAdaptor.execute_action(this, Action.action_list.CLICK, currentTree, action.getPath());
                if (response == UI.SAME) {
                    response = ClientAdaptor.execute_action(this, Action.action_list.ENTERTEXT, currentTree, "test");
                }else {
                    action.setAction(Action.action_list.CLICK);
                }
            }else
                response = ClientAdaptor.execute_action(this, action.getAction(), currentTree, action.getPath());

            if (response != UI.SAME && response != UI.OUT) {
                if (mode != MODE.REPLAY && update_stack(action) == UI.OUT){
                    response = UI.OUT;
                }else{
                    newTree = getCurrentTree();
                }
            }else{
                newTree = currentTree;
            }
        }else if (decision.code == Decision.CODE.SEQ){
            return execute_actions(decision);
        }else if (decision.code == Decision.CODE.STOP) {
            //log("stop");
            Exit = true;
        }else if (decision.code == Decision.CODE.RESTART || decision.code == Decision.CODE.GO){
            if (decision.code == Decision.CODE.RESTART) {
                if(try_back()) return UI.NEW;

                log("need restart stack size: " + fragmentStack.getSize());
                enter();
            }
            response = recover_stack(decision);
            if (response == UI.NEW || response == UI.PIDCHANGE){
                if (update_stack(null) == UI.OUT) response = UI.OUT;
            }
        }

        return response;
    }

    public Boolean try_back() throws Exception{
        log("try back");
        ClientAdaptor.goBack(this);
        String f = ClientAdaptor.getForeground(this);
        if (!f.contains(ConnectUtil.launch_pkg)){
            return false;
        }
        newTree = getCurrentTree();
        if (newTree == null || newTree.root == null
                ||fragmentStack.getPosition(newTree) == -1){
            return false;
        }else{
            return true;
        }
    }

    public int execute_actions(Decision decision) throws Exception{
        int response = UI.OUT;
        List<Action> actions = decision.actions;
        List<RuntimeFragmentNode> rfn_cache = new ArrayList<>();
        ViewTree tree = currentTree;
        for(Action action: actions){
            ClientAdaptor.execute_action(this, action.getAction(), tree, action.getPath());
            tree = getCurrentTree();
            if (tree == null || tree.root == null) return UI.OUT;
            RuntimeFragmentNode rfn = new RuntimeFragmentNode(tree);

            if(graphAdjustor.match(tree, action.target_activity, action.target_hash)){
                if (rfn_cache.size() == 0)
                    fragmentStack.top().setAction(action);
                else
                    rfn_cache.get(rfn_cache.size()-1).setAction(action);
                rfn_cache.add(rfn);
            }else{
                FragmentNode frg = graphAdjustor.searchFragment(tree);
                if (frg == null || !frg.isTraverse_over()){
                    Action action1 = new Action(action.getPath(), action.getAction());
                    action1.setTarget(tree.getActivityName(), tree.getTreeStructureHash());
                    rfn.setAction(action1);
                    break;
                }else {
                    decision.position = actions.indexOf(action) + 1;
                    log("not match in position " + decision.position);
                    return UI.SAME;
                }
            }
        }
        for(RuntimeFragmentNode rfn : rfn_cache)
            fragmentStack.add(rfn);
        return UI.NEW;
    }

    public int update_stack(Action action) throws Exception{
        newTree = getCurrentTree();
        ViewTree tree = newTree;
        if (tree == null || tree.root == null) return UI.OUT;
        if (checkLogin(tree)) tree = getCurrentTree();

        FragmentNode frg = graphAdjustor.searchFragment(tree);
        int p;
        if (mode == MODE.DFSGraph){
            p = fragmentStack.getSpecificPosition(tree);
        }else
            p = fragmentStack.getPosition(tree);

        if ((frg == null || !frg.isTraverse_over()) && p == -1){
            RuntimeFragmentNode rfn = new RuntimeFragmentNode(tree);
            if (action != null)
                fragmentStack.top().setAction(action);
            fragmentStack.add(rfn);
        }
        return 1;
    }

    public int recover_stack(Decision decision) throws Exception{
        if (currentTree == null || currentTree.root == null)
            return UI.OUT;

        int p = fragmentStack.getPosition(currentTree);
        log("recover positon: " + p);
        if (p == fragmentStack.getSize()-1) {
            newTree = currentTree;
            return UI.SAME;
        }

        if (p != -1){
            String s = currentTree.getActivityName() + "_" + currentTree.getTreeStructureHash();
            log("fragment " +  s + " in stack, recover " + p + "/" + fragmentStack.getSize());
            return fragmentStack.recover(this, p, decision);
        }

        p = go_back(2);
        if (p != -1 && p != UI.OUT)
            return fragmentStack.recover(this, p, decision);
        else
            return UI.OUT;
    }

    int go_back(int limit) throws Exception{
        int t = 0;

        do{
            int response = ClientAdaptor.execute_action(this, Action.action_list.BACK, currentTree, "");
            if (response == UI.OUT) return UI.OUT;
            currentTree = getCurrentTree();
            if (currentTree == null || currentTree.root == null) return UI.OUT;

            int p = fragmentStack.getPosition(currentTree);
            if (p != -1){
                log("Back to position " + p);
                return p;
            }else{
                log("Back to unknown position, try skip");
                Action action = graphAdjustor.getInterPathAction(this, currentTree);
                if (action != null && t < limit) {
                    ClientAdaptor.execute_action(this, Action.action_list.CLICK, currentTree, action.path);
                }else{
                    t += 1;
                    continue;
                }

                if (response == UI.OUT) return UI.OUT;
                currentTree = getCurrentTree();
                if (currentTree == null || currentTree.root == null) return UI.OUT;

                p = fragmentStack.getPosition(currentTree);
                if (p != -1) return p;
            }
            t += 1;
        }while(t < limit);
        return UI.OUT;
    }

    private Boolean restart() throws Exception{
        ClientAdaptor.stopApp(this, ConnectUtil.launch_pkg);
        ClientAdaptor.startApp(this, ConnectUtil.launch_pkg);
        currentTree = getCurrentTree();

        int limit = 3;
        int t = 0;
        while ((currentTree == null || currentTree.root == null) && t < limit){
            if (ClientAdaptor.type == ClientAdaptor.TYPE.XPOSED){
                CommonUtil.start_paladin(this);
            }
            currentTree = getCurrentTree();
            t += 1;
        }

        if (currentTree == null || currentTree.root == null){
            log("restart too many times");
            Exit = true;
            return false;
        }else
            return true;
    }

    void enter() throws Exception{

        int p = -1;
        int t = 0;
        int limit = 3;

        if (!restart()) return;

        do {
            if (checkLogin(currentTree)) currentTree = getCurrentTree();
            if (currentTree == null || currentTree.root == null){
                if (!restart()) return;
            }

            if (fragmentStack != null){
                p = fragmentStack.getPosition(currentTree);
                if (p == -1) {
                    Action action = fragmentStack.get(0).getAction();
                    int idx = action.path.indexOf("#");
                    String xpath = action.path.substring(0, idx);
                    if (currentTree.getClickable_list().contains(xpath))
                        p = 0;
                }
            }

            log("refresh");
            CommonUtil.sleep(1000);
            currentTree = getCurrentTree();
            t += 1;
        }while(p == -1 && t < limit);

        if (p == -1){
            log("restart can not match stack entry, clear stack");

            if (fragmentStack == null)
                fragmentStack = new FragmentStack();
            else
                fragmentStack.clear();
            RuntimeFragmentNode rfn = new RuntimeFragmentNode(currentTree);
            fragmentStack.add(rfn);
        }
        log("enter position: " + p);

    }

    public Boolean checkLogin(ViewTree tree) throws Exception{
        Boolean success = false;
        if (tree == null || tree.root == null) return success;
        if (tree.getActivityName().contains("LoginPasswordUI") && LOGIN_SUCCESS) {
            success = ClientAdaptor.login(this, tree);
            LOGIN_SUCCESS = success;
        }
        return success;
    }

    public void log(String info){
        CommonUtil.log("device #" + this.serial + ": " + info);
    }

    public void setRoute_list(List<String> route_list){
        this.route_list = route_list;
    }

    public List<String> getRoute_list(){
        return this.route_list;
    }
}
